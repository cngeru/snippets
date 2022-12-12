import { myPrint } from './../common';
import * as functions from "firebase-functions";
import vision from "@google-cloud/vision";
import path = require('path');

const projectId = 'vaxxies'
const keyFilename = path.resolve(__dirname, './vaxxiesService.json')

const client = new vision.ImageAnnotatorClient({projectId, keyFilename});

export const CheckFace = functions.region('europe-west1').https.onCall(async (data,context)=>{
  const {imageID} = data;
  const userID = context?.auth?.uid;
  if(userID == null || imageID==null ){
    return null;
  }
  try {
    const [result] = await client.faceDetection(`gs://vaxxies.appspot.com/avatars/${imageID}`);
    const faces = result.faceAnnotations;

    if(faces == undefined || faces == null || faces.length < 0){
      return "noFace";
    }else if(faces.length > 1){
      return "multipleFaces";
    }else if(faces.length == 1){
      if(faces[0].landmarkingConfidence! <= 0.4 || faces[0].detectionConfidence! < 0.4) {
        return "noFace";
      }
      return 'success';
    }else{
      return 'visionError';
    }
  } catch (error) {
    myPrint("visionError",error);
    return 'visionError';
  }
});

export const CheckFace2 = functions.storage.object().onFinalize(async (image) => {
  try {
    if(image == null) return;
    const imageID = image.name;
    const contentType = image?.contentType;
    if(!imageID?.startsWith('avatars/')) return;
    if(!contentType?.startsWith('image/')) return;
    const userID = imageID.includes(".")? path.basename(imageID).split(".")[0]:imageID;
    console.log(userID);
    
    const [result] = await client.faceDetection(`gs://${image.bucket}/${imageID}`);
    const faces = result.faceAnnotations;
    
    if(faces == undefined || faces == null || faces.length < 0){
      console.log("noFace");
      return;
    }else if(faces.length > 1){
      console.log("more than 1");
      return;
    }else if(faces.length == 1){
      console.log("one face")
      return;
    }else{
      console.log("eeror")
      return;
    }
  } catch (error) {
    console.log(error);
    return;
  }
});