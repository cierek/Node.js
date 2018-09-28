/**
 * AWS Lambda function to delete AMI backup images and associated snapshots
 * To be used in conjunction with delete_amis.js 
 */
var settings = {
  'region': 'ap-southeast-2',
  'noreboot': true,
  'ec2backuptagname': 'Backup',    // Add this tag to EC2 instances you wish to backup.
  'ec2backuptagvalue': 'yes',
  'amideletetagname': 'DeleteOn', // This tag name must match the one in the delete_amis.js script.
  'amideletetagvalue': 'yes'
}

var aws = require('aws-sdk')
aws.config.region = settings.region
var ec2 = new aws.EC2()
var now = new Date()
date = now.toISOString().substring(0, 10)
hours = now.getHours()
minutes = now.getMinutes()

exports.handler = function (event, context) {
  var instanceparams = {
    Filters: [{
      Name: 'tag:' + settings.ec2backuptagname,
      Values: [
        settings.ec2backuptagvalue
      ]
    }]
  }
  ec2.describeInstances(instanceparams, function (err, data) {
    if (err) console.log(err, err.stack)
    else {
      for (var i in data.Reservations) {
        for (var j in data.Reservations[i].Instances) {
          instanceid = data.Reservations[i].Instances[j].InstanceId
          nametag = data.Reservations[i].Instances[j].Tags
          for (var k in data.Reservations[i].Instances[j].Tags) {
            if (data.Reservations[i].Instances[j].Tags[k].Key == 'Name') {
              name = data.Reservations[i].Instances[j].Tags[k].Value
            }
          }
          console.log('Creating AMIs of the Instance: ', name)
          var imageparams = {
            InstanceId: instanceid,
            Name: name + '_' + date + '_' + hours + '-' + minutes,
            NoReboot: settings.noreboot
          }
          ec2.createImage(imageparams, function (err, data) {
            if (err) console.log(err, err.stack)
            else {
              image = data.ImageId
              console.log(image)
              var tagparams = {
                Resources: [image],
                Tags: [{
                  Key: settings.amideletetagname,
                  Value: settings.amideletetagvalue
                }]
              }
              ec2.createTags(tagparams, function (err, data) {
                if (err) console.log(err, err.stack)
                else console.log('Tags added to the created AMIs')
              })
            }
          })
        }
      }
    }
  })
}
