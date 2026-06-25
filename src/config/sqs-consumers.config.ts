export const sqsConsumers = [
  ...(process.env.AWS_SQS_NOTIFICATION_QUEUE_URL
    ? [
        {
          name: 'notifications-consumer',
          queueUrl: process.env.AWS_SQS_NOTIFICATION_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_POST_NOTIFICATION_QUEUE_URL
    ? [
        {
          name: 'post-notifications-consumer',
          queueUrl: process.env.AWS_SQS_POST_NOTIFICATION_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_WEEKLY_ACTIVITIES_QUEUE_URL
    ? [
        {
          name: 'weekly-activities-consumer',
          queueUrl: process.env.AWS_SQS_WEEKLY_ACTIVITIES_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_WEEKLY_ABSENCES_QUEUE_URL
    ? [
        {
          name: 'weekly-absences-consumer',
          queueUrl: process.env.AWS_SQS_WEEKLY_ABSENCES_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_WEEKLY_IMPORTANT_DATE_QUEUE_URL
    ? [
        {
          name: 'weekly-important-date-consumer',
          queueUrl: process.env.AWS_SQS_WEEKLY_IMPORTANT_DATE_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_EMAIL_QUEUE_URL
    ? [
        {
          name: 'email-consumer',
          queueUrl: process.env.AWS_SQS_EMAIL_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
];
