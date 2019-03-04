const readline = require('readline');
const request = require('request');

const url = process.env.WEBURL || 'http://localhost:3000'
console.log(`Connecting to ${url}`)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function productName() {
    return new Promise((resolve, reject) => {
        rl.question("What is the name of your product? ", function (answer) {
            if (answer === null || answer === '') {
                console.log('Please enter a valid product name.')
                reject('Please restart')
            } else {
                resolve(answer)
            }
        })
    })
}

async function trueSizesToInput() {
    return new Promise((resolve, reject) => {
            rl.question('Please enter all the true to size values (separated by commas):', function (answer) {
                if (answer === null || answer === '') {
                    console.log('Please enter a valid set of numbers.')
                    reject('Please restart')
                    return
                }

                const list = answer.split(',')
                for (var i = 0; i < list.length; i++) {
                    if (list[i] < 1 || list[i] > 5) {
                        console.log(`Please enter a valid set of numbers. ${list[i]} is invalid`)
                        reject('Please restart')
                        return
                    }
                }

                resolve(list)
            })
        })
}

async function Get(url) {
    var option = { method: 'get', url: url }
    return new Promise( (resolve, reject) =>{
        request(option, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body)
            } else {
                console.log(`Error POSTING: ${JSON.stringify(error)} ${JSON.stringify(body)} ${JSON.stringify(response)}`)
                reject('Please restart')
            }
        })
    })
}

async function Post(url, value) {
    var option = { method: 'post', url: url, json: false }
    if(value !== null) {
        option.json = value
    }

    return new Promise( (resolve, reject) => {
            request(option, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body)
                } else {
                    console.log(`Error POSTING: ${JSON.stringify(error)} ${JSON.stringify(body)} ${JSON.stringify(response)}`)
                    reject('Please restart')
                }
            })
        })
}

async function main() {
    if(process.env.SETUPDB === '1') {
        console.log('Initializing database.')
        await Post(`${url}/database/initialize`, null)
    }

    var name = ''
    while (name === '' || name === null) {
        try {
          name = await productName()
        } catch (error) {
          name = ''
        }
    }

    var modelUrl = `${url}/stockx/v1/models`
    const model = await Post(modelUrl, { name: name, description: 'test', company: 'test' })
    console.log(`The new product model you created is at: ${modelUrl}/${model.result.id}`)

    var values = null
    while (values === null) {
        console.log('Asking now')
        try {
            values = await trueSizesToInput()
        } catch (error) {
            values = null
        }
    }

    for (var i = 0; i < values.length; i++) {
        console.log(`Adding ${i+1}: ${values[i]}`)
        await Post(`${url}/stockx/v1/models/${model.result.id}/stats`, { size: values[i] })
    }

    console.log('Now calculating true to size...')
    const trueToSize = await Get(`${modelUrl}/${model.result.id}/true-to-size`, null)
    console.log(`True to size calculation: ${trueToSize}`)

    console.log(`You can visit the true to size value here: ${modelUrl}/${model.result.id}/true-to-size`)
    return "done";
}

main()
    .then(v => console.log(v))
    .catch(err => console.log(err))