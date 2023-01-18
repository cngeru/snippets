import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import dayjs = require("dayjs");

export const DeleteOldBookings = functions.pubsub.schedule('every day 00:00').onRun(async(_context) => {
  const timeUnix = dayjs().subtract(1,'day').unix() * 1000
  const query = db.collection('bookings').where("timeInfo.startTimeStamp","<=",timeUnix).limit(400);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
});

async function deleteQueryBatch(query:any, resolve:any) {
  const snapshot = await query.get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc: { ref: any; }) => {
    batch.delete(doc.ref);
  });
  await batch.commit()
  process.nextTick(() => {
    deleteQueryBatch(query, resolve).catch((e)=>console.log(e));
  });
}