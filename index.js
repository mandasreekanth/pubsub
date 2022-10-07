const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const { PubSub } = require('@google-cloud/pubsub');
const PORT = 3000;
const pubSubTopicId ='pubsub';
const pubsubClient = new PubSub({projectId: 'inspired-bebop-364701'})
const topicNameOrId = 'sample-topicn';

app.get('/test',(req,res)=>{
    res.send("it's working fine");
})

app.post('/registration/', async (req, res) => {
    const { name, email, password } = req.body
    const user = { name, email, password}
    dummy_user_database.push(user)

    // Publish a message to the topic
    try {
        const message = Buffer.from(JSON.stringify(user))
        const messageId = await pubSubClient
            .topic(pubSubTopicId)
            .publishMessage({
                'data': message,
                'attributes': {
                    'kind': 'registration'
                }
            });
        console.log(`Message ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${error.message}`);
    }

    res.status(201).json(user);
});
app.post('/publishToFormSubmit', async (req, res) => {
    const dataBuffer = Buffer.from(JSON.stringify(req.body));
    const customAttributes = {
        origin: req.headers.host,
        subscribeInterval: req.query.subscriptionInterval
    };

    const message = {
        data: dataBuffer,
        attributes: customAttributes
    };

    try {
        const messageId = await pubsubClient
            .topic(topicNameOrId)
            .publishMessage(message);
        res.send(`Message ${messageId} published.`)
    } catch(error) {
        res.send(`Error log ${error}`)
    }
});

//subscribing topic messages on given (/getDataFormSubmit?interval=<value> => req.query.interval) intervals
app.get("/getDataFormSubmit", async (req, res) => {
    const timeout = 10;
    const subsNameorId = `sample-topic-sub-${req.query.interval}`

    const subscription = pubsubClient
    .topic(topicNameOrId)
    .subscription(subsNameorId);
    
    let messageCount = 0;
    const messageList = [];
    const messageHandler = message => {
        console.log(`Received messages}:`);
        messageCount += 1;
        messageList.push(JSON.parse(message?.data?.toString()));

        // "Ack" (acknowledge receipt of) the message
        message.ack();
    };
    
    
    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);
    
    setTimeout(() => {
        res.send(messageList);
        subscription.removeListener('message', messageHandler);
        console.log(`${messageCount} message(s) received.`);
    }, timeout * 1000);
})

app.listen(PORT, (serverStartData) => {
    console.log("Server starter data", serverStartData)
    console.log(`Server started at port ${PORT}`);
})
