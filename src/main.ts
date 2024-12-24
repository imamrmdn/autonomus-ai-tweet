import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import { CronJob } from 'cron';
import { tweetsData } from './utils/tweet';

import 'dotenv/config';

//
const clientTw = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_KEY_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});
//
const bearerTw = new TwitterApi(process.env.BEARER_TOKEN);

//
const tw = clientTw.readWrite;
const twBearer = bearerTw.readOnly;

//
let twCounter = 0

async function sendTweet(){
  //
  // const tweetContent = `Hello, world! This tweet has an image. 🚀\n\nAutomate by: @cotabimcotab`;
  //const tweetContent = `🌌 Hi, I’m Suzy—a teenage cyborg exploring the neon-lit streets of a cyberpunk world. 🎧💻 Join me on adventures filled with tech, gaming, and futuristic vibes! #CyberpunkLife"`
  //
  // if(twCounter < tweetsData.length){
  //   const tweetContent = tweetsData[twCounter].tweet;
  //     //
  //     try {
  //       // send tweet
  //       await tw.v2.userByUsername('cotabimcotab');
  //       await tw.v2.tweet(tweetContent);
  //       console.log(`Tweet #${twCounter + 1} succesfuly sent:`, tweetContent);
  //       twCounter++;
  //     } catch (error) {
  //       console.error('Error sent tweet', error);
  //     }

  // }else{
  //   console.log('all tweet already sent');
  //   if (job) job.stop(); // Hentikan cron job setelah 10 tweet terkirim
  // }

  try {
      const tweetContent = tweetsData[twCounter].tweet;
      // send tweet
      //await tw.v2.userByUsername('cotabimcotab');
      await tw.v2.tweet(tweetContent);
      console.log(`Tweet #${twCounter + 1} succesfuly sent:`, tweetContent);
      twCounter++;
  } catch (error) {
    if (error.code === 429) {
      const resetTime = new Date(error.rateLimit.day.reset * 1000).toLocaleString();
      console.log(
        `Rate limit reached. Wait until: ${resetTime}. Remaining application quota: ${error.rateLimit.day.remaining}`
      );
    } else {
      console.error('Error sent tweet', error);
    }
  }

}

async function main() {
  //
  const app = await NestFactory.create(AppModule);
  //
  app.enableCors({
    origin: '*', // replace with your allowed origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      // 'Origin,Content-Type,Authorization,Accept,User-Agent,Cache-Control,Pragma,x-api-key',
      'x-api-key',
    credentials: true,
    exposedHeaders: 'Content-Length',
    maxAge: 43200, // 12 hours
  });

  //
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const job = new CronJob(
    '*/15 * * * *', //0 * * * * //*/5 * * * * 
    () => {
      //
      if (twCounter < tweetsData.length) {
        console.log('Running Tweet');
        sendTweet();
      } else {
        console.log('All tweet already sent');
        job.stop(); // Hentikan cronjob jika semua tweet sudah dikirim
      }
    },
    () => {
      console.log('tweet succesfully sent.');
    },
    true
  );
  
  //
  console.log('The cron job has started. A tweet will be sent every 15 minutes.');

  //
  await app.listen(process.env.PORT ?? 3000);
  console.log(`tweet bot is running at: ${await app.getUrl()}`)
}

main();
