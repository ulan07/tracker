import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type:String,
        required: true
    },
    status: {
        type:String,
        required: true
    },
    dayNotes: {
        type:String,
        required: true
    },
    totalTime: {
        type: Number,
        default: 0
    },
    tasks: [{
        id: {
            type: Number,
            required: true
        },
        text: {
            type:String,
            required: true
        },
        completed: {
            type: Boolean,
            required: true
        },
        seconds: {
            type: Number,
            required: true
        }
    }]
});

const history = mongoose.model('History', historySchema);
export default history;