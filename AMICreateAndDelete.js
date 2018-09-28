/**
 * AWS Lambda function to delete AMI backup images and associated snapshots
 * To be used in conjunction with delete_amis.js 
 */
var settings = {
  'region': 'eu-west-2', // skip last letter if necessary(original was eu-west-2a)
  'noreboot': true,
  'ec2backuptagname': 'Backup',    // Add this tag to EC2 instances you wish to backup.
  'ec2backuptagvalue': 'yes',
  'amideletetagname': 'DeleteOn', // This tag name must match the one in the delete_amis.js script.
  'amideletetagvalue': 'yes',
  'retention_days': 7, // how long AMI will be stored?
  'ami_deregister_wait_time_ms': 10000
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
