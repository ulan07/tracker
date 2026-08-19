import mongoose from 'mongoose';

// 1. Создаем схему
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,  // обязательное поле
        unique: true,    // не должно быть дубликатов в базе
        trim: true       // автоматически удаляет лишние пробелы
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // автоматически ставит текущую дату
    }
});

// 2. Превращаем схему в модель и экспортируем её
const User = mongoose.model('User', userSchema);
export default User;
