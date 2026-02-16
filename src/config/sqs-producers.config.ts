export const sqsProducers = [
  ...(process.env.AWS_SQS_NOTIFICATION_QUEUE_URL
    ? [
        {
          name: 'notifications',
          queueUrl: process.env.AWS_SQS_NOTIFICATION_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
  ...(process.env.AWS_SQS_POST_NOTIFICATION_QUEUE_URL
    ? [
        {
          name: 'post-notifications',
          queueUrl: process.env.AWS_SQS_POST_NOTIFICATION_QUEUE_URL,
          region: process.env.AWS_REGION || 'us-east-1',
        },
      ]
    : []),
];
