import Fastify, { type FastifyError } from 'fastify';
import cookiePlugin from '@fastify/cookie';
import jwtPlugin from '@fastify/jwt';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            sub: string;
        };
    }
}
import { pool } from './db';
import z from 'zod';
import { hash, verify } from 'argon2';

const app = Fastify();

const port = +(process.env.PORT ?? 3000);

const start  = async () => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not set');
        }

        await app.register(cookiePlugin);
        await app.register(jwtPlugin, { secret: jwtSecret, cookie: {
            cookieName: 'token',
            signed: false
        } });
        
        await app.listen({port, host: '127.0.0.1' });
        console.log(`listening on ${port}`);
    } catch(err) {
        console.error(err);
        process.exit(1)
    }
}

start();

app.setErrorHandler((error: FastifyError, _req, reply) => {
    const statusCode = error.statusCode ?? 500;
    reply.code(statusCode).send({
        error: statusCode >= 500 ? 'internal' : 'validation',
        message: statusCode >= 500 ? 'Internal server error' : 'Invalid body'
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

const registerBodySchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

app.post('/auth/register', async (req, reply) => {
    try{
        const body = registerBodySchema.parse(req.body);
        const email = body.email.toLowerCase();
        const passwordHash = await hash(body.password);

       const result = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
            [email, passwordHash, body.name]
        )

        const user = result.rows[0];

        const token = await reply.jwtSign({ sub: user.id });

        reply.setCookie('token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })
        
        return reply.code(201).send(user)
    }
    catch(err) {
        if(err && typeof err === 'object' && 'code' in err && err.code === '23505') {
            return reply.code(409).send({
                error: 'conflict',
                message: 'Email already taken'
            })
        }

        return reply.code(400).send({
            error: 'validation',
            message: 'Invalid body'
        })
    }
});

const loginBodySchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});

app.post('/auth/login', async (req, reply) => {
    try {
        const body = loginBodySchema.parse(req.body);
        const email = body.email.toLowerCase();

        const result = await pool.query('SELECT id, name, password_hash FROM users WHERE email = $1', [email]);

        if(!result.rows.length) {
            return reply.code(401).send({
                error: 'unauthorized',
                message: 'Invalid email or password'
            })
        }

        const user = result.rows[0];

        const ok = await verify(user.password_hash, body.password);

        if(!ok) {
            return reply.code(401).send({
                error: 'unauthorized',
                message: 'Invalid email or password'
            })
        }
        const token = await reply.jwtSign({ sub: user.id });

        reply.setCookie('token', token, {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
        })

        return reply.send({
            id: user.id,
            name: user.name,
            email: body.email,
        })
    } catch(err) {
        return reply.code(400).send({
            error: 'validation',
            message: 'Invalid body'
        })
    }
})

app.get('/auth/me', async (req, reply) => {
    try {
        await req.jwtVerify();

        const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.sub])

        if(!result.rows.length) {
            return reply.code(401).send({
                error: 'unauthorized',
                message: 'Unauthorized'
            })
        }

        const user = result.rows[0];
        return reply.send(user);
    } catch {
        return reply.code(401).send({
            error: 'unauthorized',
            message: 'Unauthorized'
        })
    }
})

app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/' })

    return { ok: true}
})