import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { recipients } = await request.json();
    
  
const API_KEY = process.env.BULK_SMS_API_KEY; 
const SENDER_ID = process.env.BULK_SMS_SENDER_ID || "SCHLNT";

    // 2. Loop through each absent student and send the SMS
    for (const student of recipients) {
      const smsMessage = `THIS IS TEST MESSAGE TO START BULK SMS SERVICE WITH ${student.name} HENCE DIGITAL`;
      
      // Change the URL inside your loop to use this exact layout:
const apiUrl = `https://www.bulksmsplans.com/api/send_sms?api_id=${API_ID}&api_password=${API_PASSWORD}&sms_type=transactional&sms_encoding=text&sender=${SENDER_ID}&number=${student.phone}&message=${encodeURIComponent(smsMessage)}`;
      
      console.log(`Sending API Request for ${student.name} to: ${apiUrl}`);

      // Fire to gateway and capture terminal response 
      const response = await fetch(apiUrl, { method: 'GET' });
      const resultText = await response.text();
      
      console.log(`BulkSMSPlans Server Reply for ${student.name}:`, resultText);
    }

    return NextResponse.json({ success: true, message: "SMS dispatched successfully" });
  } catch (error) {
    console.error("Backend SMS Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}