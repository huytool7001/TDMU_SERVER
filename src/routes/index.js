import express from 'express';
import tokenRouter from './token.js';

const app = express();
app.use('/tokens', tokenRouter);

export default app;
