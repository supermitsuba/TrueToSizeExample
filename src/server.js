const express = require('express')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// load config file if debugging locally
// if debugging from container, those values will be injected by docker
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

// Express magic
const app = express()
const port = process.env.PORT
app.use(express.json())

// Postgres client
const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DBDATABASENAME,
    password: process.env.DBPWD,
    port: process.env.DBPORT
})

app.get('/ping', (req, res) => res.send('Hello World!'))

app.post('/database/initialize', async (req, res) => {
    try {
        // could cache this value instead of reading it all the time.
        // but the tradeoff would be you couldnt change this at runtime.
        const sqlScript = GetCreateTableScript();
        const result = await pool.query(sqlScript)
        res.send({ 'result': result })
    } catch (error) {
        console.log(error)
        res.status(400)
        res.send({ 'error': error, 'description': 'You probably have this table already in the database.' })
    }
})

function GetCreateTableScript() {
    const fileToRead = path.join(__dirname, '..', 'postgres', 'scripts', '02-CreateTable.sql')
    const file = fs.readFileSync(fileToRead, 'utf8')
    return file
}

app.get('/stockx/v1/models', async (req, res) => {
    try {
        const result = await pool.query('select * from model')
        res.send({ 'results': result.rows })
    } catch (err) {
        console.log(err)
        res.status(400)
        res.send({ 'error': err })
    }
})

app.post('/stockx/v1/models', async (req, res) => {
    if( !ValidateModel(req, res) ) 
        return  

    const values = [ req.body.name, req.body.description, 'API_user', req.body.company ]
    const sqlScript = 
        `INSERT INTO model (name, description, dateofentry, lastmodified, createdby, company)
        VALUES ($1, $2, current_timestamp, current_timestamp, $3, $4)
        RETURNING id, name, description, dateofentry, lastmodified, createdby, company`
    
    try {
        const result = await pool.query(sqlScript, values)

        res.send({ 'result': result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(400)
        res.send({ 'error': err })
    }
})

function ValidateModel(req, res) {
    if(req.body.name === null || req.body.name === '') {
        res.status(400)
        res.send({ 'error': 'A model needs a name, description and company.' })
        return false
    }

    if(req.body.description === null || req.body.description === '') {
        res.status(400)
        res.send({ 'error': 'A model needs a name, description and company.' })        
        return false
    }

    if(req.body.company === null || req.body.company === '') {
        res.status(400)
        res.send({ 'error': 'A model needs a name, description and company.' })
        return false
    }

    return true
}

app.get('/stockx/v1/models/:modelId', async (req, res) => {
    var modelId = req.params.modelId
    try {
        const result = await pool.query('SELECT * FROM public.model WHERE id = $1', [modelId])
        res.send({ 'results': result.rowCount > 0 ? result.rows[0] : result.rows  })
    } catch (err) {
        console.log(err)
        res.status(400)
        res.send({ 'error': err })
    }
})

app.get('/stockx/v1/models/:modelId/true-to-size', async (req, res) => {
    try {
        const result = await pool.query('SELECT AVG(size) FROM stats WHERE modelId = $1', [req.params.modelId])
        if(result.rowCount > 0)
        {
            res.send({ 'result': result.rows[0].avg })
        } else {
            res.send({ 'result': 'no value available' })
        }
    } catch (err) {
        console.log(err)
        res.status(400)
        res.send({ 'error': err })
    }
})

app.post('/stockx/v1/models/:modelId/stats', async (req, res) => {
    if( !ValidateStats(req, res) ) 
        return  

    const values = [ req.params.modelId, req.body.size, 'API_user' ]
    const sqlScript = 
        `INSERT INTO stats (modelId, size, dateofentry, lastmodified, createdby)
        VALUES ($1, $2, current_timestamp, current_timestamp, $3)
        RETURNING id, modelId, size, dateofentry, lastmodified, createdby`

    try {
        const result = await pool.query(sqlScript, values)

        res.send({ 'result': result.rows[0] })
    } catch (err) {
        console.log(err)
        res.status(400)
        res.send({ 'error': err })
    }
})


function ValidateStats(req, res) {
    if(req.body.modelId === null || req.body.modelId === '') {
        res.status(400)
        res.send({ 'error': 'A stat needs a model id and size.' })
        return false
    }

    if(req.body.size === null || req.body.size === '') {
        res.status(400)
        res.send({ 'error': 'A stat needs a model id and size.' })        
        return false
    }

    if(req.body.size > 5 || req.body.size < 1) {
        res.status(400)
        res.send({ 'error': 'A size must be between and including 1 and 5.' })        
        return false
    }

    return true
}


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
