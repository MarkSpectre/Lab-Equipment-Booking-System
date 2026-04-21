import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  awsSnsTopicArn: process.env.AWS_SNS_TOPIC_ARN || "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsSessionToken: process.env.AWS_SESSION_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
