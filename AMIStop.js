/**
 * AWS Lambda function to delete AMI backup images and associated snapshots
 * This script just creates AMIs and tags them
 * Official documentation: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
 */
var settings = {
  'region': 'eu-west-2', // if you get an error like "region not found" or not supported remove the last letter the original region was eu-west-2a
};
var params = {
  InstanceIds: [
     "i-0f6fb8ed0a3aed833"
  ]
 };
var aws = require('aws-sdk')
aws.config.region = settings.region
var ec2 = new aws.EC2()

 ec2.stopInstances(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data);           // successful response
   
   data = {
    StoppingInstances: [
       {
      CurrentState: {
       Code: 64, 
       Name: "stopping"
      }, 
      InstanceId: "i-0f6fb8ed0a3aed833", 
      PreviousState: {
       Code: 16, 
       Name: "running"
      }
     }
    ]
   }
   
 });
