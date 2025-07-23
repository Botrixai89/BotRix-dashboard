import mongoose, { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

export default (mongoose.models?.User as mongoose.Model<any>) || model('User', UserSchema); 