const amqp = require('amqplib');

let channel;
const queue = 'test-queue'

//Connect to rabbitmq and intialize channel
const rabbitmqConnect = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL ||  'amqp://guest:guest@localhost:5672/');
        channel = await connection.createChannel();

        //testing
        // await channel.assertQueue(queue);

        // const msg = 'Hello, RabbitMQ!';
        // await channel.sendToQueue(queue, Buffer.from(msg));


        // console.log(`Message sent to ${queue}: ${msg}`);
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.log('Error connecting to rabbitmq: ', error);
    }
};

//Publish a message to a specific queue
module.exports.publish = async (queue, message) => {
    if(!channel) {
        await rabbitmqConnect();
    }
    try {
        await channel.assertQueue(queue, {durable: true});
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
            persistent: true
        })
        console.log(`Message sent to ${queue}`, message);
    } catch (error) {
        console.error('Failed to publish message to queue: ', error);
    }
};

module.exports.consume = async (queue, callback) => {
    if(!channel){
        await rabbitmqConnect();
    }
    try {
        await channel.assertQueue(queue, {durable: true});
        channel.consume(queue, (message) => {
            if(message != null){
                callback(message);
                channel.ack(message); //Acknowledging that message has been consumed
            }
        })
        console.log(`Listening for message on ${queue}...`);
    } catch(error) {
        console.error(`Failed to consume message from ${queue}`, error);
    }
}

rabbitmqConnect();