/**
 * AWS Lambda function to delete AMI backup images and associated snapshots
 * To be used in conjunction with create_amis.js 
 * source: https://gist.github.com/hutch120/c5a695329ce0cab76268ffa2c258dba6
 * author: https://github.com/hutch120
 */
var settings = {
  'region': 'ap-southeast-2',
  'retention_days': 7,
  'ami_delete_tag_name': 'DeleteOn', // This tag name must match the one in the create_amis.js script.
  'ami_delete_tag_value': 'yes',
  'ami_deregister_wait_time_ms': 10000
}

var aws = require('aws-sdk')
aws.config.region = settings.region
var ec2 = new aws.EC2()
var d = new Date()
var x = settings.retention_days
d.setDate(d.getDate() - x)
reqdate = d.toISOString().substring(0, 10)
exports.handler = function (event, context) {
  ec2.describeImages({
    Owners: [
      'self'
    ],
    Filters: [{
      Name: 'tag:' + settings.ami_delete_tag_name,
      Values: [
        settings.ami_delete_tag_value
      ]
    }]

  }, function (err, data) {
    if (err) console.log(err, err.stack)
    else {
      for (var j in data.Images) {
        imagename = data.Images[j].Name
        imageid = data.Images[j].ImageId

        if (imagename.indexOf(reqdate) > -1) {
          console.log('image that is going to be deregistered: ', imagename)
          console.log('image id: ', imageid)

          var deregisterparams = {
            ImageId: imageid
          }
          ec2.deregisterImage(deregisterparams, function (err, data01) {
            if (err) console.log(err, err.stack) // an error occurred
            else {
              console.log('Image Deregistered')
            }
          })
        }
      }
      setTimeout(function () {
        for (var j in data.Images) {
          imagename = data.Images[j].Name
          if (imagename.indexOf(reqdate) > -1) {
            for (var k in data.Images[j].BlockDeviceMappings) {
              snap = data.Images[j].BlockDeviceMappings[k].Ebs.SnapshotId
              console.log(snap)
              var snapparams = {
                SnapshotId: snap
              }
              ec2.deleteSnapshot(snapparams, function (err, data) {
                if (err) console.log(err, err.stack) // an error occurred
                else console.log('Snapshot Deleted') // successful response
              })
            }
          }
        }
      }, settings.ami_deregister_wait_time_ms)
    }
  })
}
