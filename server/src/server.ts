import Fastify from 'fastify';
import { pool } from './db';

const app = Fastify();

app.setErrorHandler((error, _req, reply) => {
    console.log(error);
    reply.code(500).send({
        error: 'internal',
        message: 'Internal server error'
    })
})

app.get('/health', async (_req, reply) => {
    try {
        await pool.query('SELECT 1');
        return { status: 'ok' }
    }catch(err) {
        console.error(err);
        reply.code(503)
        return { status: 'error' }
    }
});

const port = +(process.env.PORT ?? 3000);

const start  = async () => {
    try {
        await app.listen({port, host: '127.0.0.1' });
        console.log(`listening on ${port}`);
    } catch(err) {
        console.error(err);
        process.exit(1)
    }
}

start();