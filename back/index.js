import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import User from './modules/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import History from './modules/History.js';
import cors from 'cors';
import { OpenAI } from 'openai';

const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY
        });

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB подключена успешно');
} catch(error) {
    console.log('Ошибка подключения к MongoDB:', error);
}

const app = express();
app.use(cors());
const PORT = process.env.PORT || 7777;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPath = path.resolve(__dirname, '..', 'front');

app.use(express.static(mainPath));
app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, password: hashPassword });
        const token = jwt.sign({ userId: newUser._id }, 'SUPER_SECRET_KEY', { expiresIn: '30d' });

        return res.status(201).json({
            success: true,
            message: 'Пользователь успешно сохранен в базу!',
            token: token,
            user: { id: newUser._id, email: newUser.email }
        });
    } catch(error) {
        console.error('Ошибка регистрации:', error);
        return res.status(400).json({ success: false, message: 'Такой аккаунт уже существует!' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Такого логина нет!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Неверный пароль!' });
        }

        const token = jwt.sign({ userId: user._id }, 'SUPER_SECRET_KEY', { expiresIn: '30d' });

        return res.status(200).json({
            success: true,
            message: 'Вы успешно вошли!',
            token: token,
            user: { id: user._id, email: user.email }
        });
    } catch(error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

app.post('/api/history/save', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Доступ запрещен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'SUPER_SECRET_KEY');

        console.log('Данные сохраняет пользователь с ID:', decoded.userId);

        const updatedDay = await History.findOneAndUpdate(
            { userId: decoded.userId, date: req.body.date },
            {
                status: req.body.status,
                dayNotes: req.body.dayNotes,
                tasks: req.body.tasks,
                totalTime: req.body.totalTime || 0
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Данные дня синхронизированы!',
            data: updatedDay
        });
    } catch(error) {
        console.log(error);
        return res.status(401).json({ success: false, message: 'Неверный или протухший токен' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(mainPath, 'index.html'));
});

// Загрузка всей истории пользователя из MongoDB
app.get('/api/history/load', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Доступ запрещен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'SUPER_SECRET_KEY');
        const userHistory = await History.find({ userId: decoded.userId });

        return res.status(200).json({ success: true, history: userHistory });
    } catch(error) {
        console.log(error);
        return res.status(401).json({ success: false, message: 'Неверный или протухший токен' });
    }
});

app.post('/api/ai/chat',async (req,res) =>{
    try{
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Доступ запрещен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'SUPER_SECRET_KEY');

        const { date, userMessage} = req.body;
        const dayData = await History.findOne({userId: decoded.userId, date: date});
        let finalPrompt = ""
        if(!userMessage){
            finalPrompt = "Проанализируй мой текущий день на основе моих задач и дай совет";
        }
        else{
            finalPrompt = userMessage;
        }

        const tasksContext = dayData && dayData.tasks && dayData.tasks.length>0 ? 
        dayData.tasks.map(task => {
            const status = task.completed ? 'Выполнено' : 'Не выполнено';
            return `- [${task.text}]: ${status} (Время: ${task.seconds} секунд)`;
        }).join('\n')
        : "Пользователь еще не добавил задачи на этот день";

        const systemPrompt = `Ты — жесткий, но мотивирующий AI-ментор по продуктивности и дисциплине.
        Твоя цель — помогать пользователю анализировать его успехи и отвечать на его вопросы.
        Вот данные за выбранный день (${date}):
        Статус дня: ${dayData?.status || 'Не указан'}
        Заметки дня: ${dayData?.dayNotes || 'Заметок нет'}
        Список задач на сегодня:\n${tasksContext}`;

        

        const completion = await openai.chat.completions.create({
            model : "google/gemma-4-26b-a4b-it:free",
            messages : [{ role: "system", content: systemPrompt }, { role: "user", content: finalPrompt }]
        });
        return res.status(200).json({ success: true, reply: completion.choices[0].message.content });

    }
    catch(error){
        console.log(error);
        return res.status(500).json({ success: false});
    }
})

app.delete('/api/history/clear', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'Доступ запрещен' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'SUPER_SECRET_KEY');

        const result = await History.deleteMany({ userId: decoded.userId });

        return res.status(200).json({
            success: true,
            message: 'Вся история успешно удалена!',
            deletedCount: result.deletedCount
        });
    } catch(error) {
        console.log(error);
        return res.status(401).json({ success: false, message: 'Неверный или протухший токен' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});

