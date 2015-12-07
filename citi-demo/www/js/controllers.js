angular.module('starter.controllers', ['starter.services', 'ngCordova', 'ngCordovaBeacon'])

  .controller('DashCtrl', function ($rootScope, $scope, $timeout, $ionicPlatform, $cordovaDevice, $cordovaBeacon, BluetoothDiscovery, $ionicPopup, BeaconInfo) {
    //need to add location
    //need to change bluetooth proximity 1 - Imm, 2 - Near, 3 - Far, -1 - Unknown
    $scope.info = {
      event: "",
      deviceId: null,
      wifiSSID: null,
      ipAddress: null,
      bluetoothAddress: [],
      beacons: {}
    };
    $scope.showScanning = true;
    $scope.showDeviceList = false;
    $scope.devices = [];
    $scope.loginInit = false;
    $scope.orientation = {'magneticHeading': 0, 'timestamp': 0}

    $scope.scan = function () {
      $scope.info.bluetoothAddress = BluetoothDiscovery.devices;
      console.log($scope.info);
    };

    $scope.showConfirm = function (type) {
      if (type == 'PUSH') {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Please Confirm',
          template: 'Please confirm authentication for account ?'
        });


        confirmPopup.then(function (res) {
          if (res) {

            var obj = {
              masterId: $scope.info.deviceId,
              event: 'LOGIN_ACTION_CONFIRMED',
              deviceId: $scope.info.deviceId
            };

            $scope.devices = BluetoothDiscovery.devices;

            confirmPopup.close()
            $scope.showDeviceList = true;
            $scope.server.send(JSON.stringify(obj));
            $scope.loginInit = false;
            $scope.showScanning = false;
          } else {
          }
        });

      } else {
        var myPopup = $ionicPopup.show({
          template: 'Change the orientation of the device',
          title: 'Confirm',
          subTitle: 'Please use normal things',
          scope: $scope,
        });
        if (navigator.compass) {
          if ($scope.watchId) {
            navigator.compass.clearWatch($scope.watchId);
          }

          function onSuccess(heading) {
            if (Math.abs(heading.magneticHeading - $scope.orientation.magneticHeading) > 60) {
              var obj = {
                masterId: $scope.info.deviceId,
                event: 'LOGIN_ACTION_CONFIRMED',
                deviceId: $scope.info.deviceId
              };

              $scope.devices = BluetoothDiscovery.devices;


              $scope.showDeviceList = true;
              $scope.server.send(JSON.stringify(obj));
              $scope.loginInit = false;
              $scope.showScanning = false;
              myPopup.close()
            }
            ;
          };

          function onError(error) {
            alert('CompassError: ' + error.code);
          };

          navigator.compass.getCurrentHeading(onSuccess, onError);
        }
      }
    };

    $ionicPlatform.ready(function () {

      BluetoothDiscovery.bindCordovaEvents();



      if (window.cordova) {
        $scope.info.deviceId = $cordovaDevice.getUUID();

        $scope.server = new WebSocket("ws://calm-sands-9581.herokuapp.com/ws");

        $scope.server.onopen = function (event) {
          var obj = {
            event: 'OPEN',
            masterId: $scope.info.deviceId,
            status: 'INIT'
          };
          $scope.server.send(JSON.stringify(obj));
          console.log(event);
        };

        $scope.server.onmessage = function (e) {
          var event = null;

          try {
            event = JSON.parse(e.data);
          } catch (e) {
          }

          if (event !== null) {
            switch (event.event) {
              case 'LOGIN_INIT':
              function onSuccess(heading) {
                $scope.orientation['magneticHeading'] = heading.magneticHeading;
                $scope.orientation['timestamp'] = heading.timestamp;
              };

              function onError(compassError) {
                console.log('Compass error: ' + compassError.code);
              };

                var options = {
                  frequency: 1000
                }; // Update every 3 seconds

                if (navigator.compass) {
                  $scope.watchId = navigator.compass.watchHeading(onSuccess, onError, options);
                }


                $scope.showScanning = true;
                $scope.showDeviceList = false;
                $scope.loginInit = true;
                var master = {
                  masterId: $scope.info.deviceId,
                  event: "LOGIN_DEVICES",
                  deviceId: $scope.info.deviceId,
                  deviceType: "SMART_PHONE",
                  wifiSSID: $scope.info.wifiSSID,
                  ipAddress: $scope.info.ipAddress
                };
                $scope.server.send(JSON.stringify(master));


                //add timeouts for the messages
                angular.forEach(BeaconInfo.beacons, function (value, key) {
                  var beacon = {
                    masterId: $scope.info.deviceId,
                    event: "LOGIN_DEVICES",
                    deviceId: value['uuid'],
                    deviceType: "BEACON",
                    proximity: value['proximity']
                  };
                  $scope.server.send(JSON.stringify(beacon));
                });

                for (var i = 0; i < BluetoothDiscovery.devices.length; i++) {
                  var bluetoothDevices = {
                    masterId: $scope.info.deviceId,
                    event: "LOGIN_DEVICES",
                    deviceId: 'b9407f30-f5f8-466e-aff9-25556b57fe6d',
                    deviceName: BluetoothDiscovery.devices[i]["deviceName"],
                    bluetoothAddress: BluetoothDiscovery.devices[i]["deviceAddress"],
                    deviceType: "BEACON"
                  };

                  $scope.server.send(JSON.stringify(bluetoothDevices));
                }
                break;
              case 'LOGIN_ACTION_REQUIRED':
                if ($scope.loginInit) {
                  $scope.showConfirm('PUSH');
                }
                break;
              default:
                break;
            }
          }
        };

        $scope.server.onclose = function (event) {
          console.log("websocket closing");
          console.log(event)
        };




        $cordovaBeacon.requestWhenInUseAuthorization();
        BeaconInfo.masterDeviceId = $scope.info.deviceId;
        BeaconInfo.server = $scope.server;
        BeaconInfo.getLocationManager();
        BeaconInfo.startScanForBeacons();
        /*$rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
            var uniqueBeaconKey;
            for (var i = 0; i < pluginResult.beacons.length; i++) {
              uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
              var originalProximity = '';
              if (angular.isDefined($scope.info.beacons[uniqueBeaconKey]) && $scope.info.beacons[uniqueBeaconKey] !== null) {
                originalProximity = $scope.info.beacons[uniqueBeaconKey]['proximity'];
              }

              $scope.info.beacons[uniqueBeaconKey] = pluginResult.beacons[i];

              switch ($scope.info.beacons[uniqueBeaconKey]['proximity']) {
                case 'ProximityImmediate':
                  $scope.info.beacons[uniqueBeaconKey]['proximity'] = 1;
                  break;
                case 'ProximityNear':
                  $scope.info.beacons[uniqueBeaconKey]['proximity'] = 2;
                  break;
                case 'ProximityFar':
                  $scope.info.beacons[uniqueBeaconKey]['proximity'] = 3;
                  break;
                default:
                  $scope.info.beacons[uniqueBeaconKey]['proximity'] = -1;
                  break;
              }

              if (originalProximity != $scope.info.beacons[uniqueBeaconKey]['proximity']) {
                var beaconDevice = {
                  masterId: $scope.info.deviceId,
                  event: "LOGIN_DEVICES",
                  deviceName: 'ESTIMOTE',
                  deviceId: pluginResult.beacons[i].uuid,
                  deviceType: "BEACON",
                  proximity: $scope.info.beacons[uniqueBeaconKey]['proximity']
                };

                $scope.server.send(JSON.stringify(beaconDevice));
              }

            }
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
        )*/

        //$cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "b9407f30-f5f8-466e-aff9-25556b57fe6d"));

        navigator.wifi.getWifiInfo(function (wifiInfo) {
          $scope.info.wifiSSID = wifiInfo.connection.SSID;
          $scope.info.ipAddress = wifiInfo.connection.IpAddress;
        }, function (error) {
          console.log(error);
        }, [{}]);
      }
      //b9407f30-f5f8-466e-aff9-25556b57fe6d




    });

    $scope.sendMessage = function (device) {
      if ($scope.loginInit) {
        var bluetoothDevice = {
          masterId: $scope.info.deviceId,
          event: "LOGIN_DEVICES",
          deviceId: 'b9407f30-f5f8-466e-aff9-25556b57fe6d',
          deviceName: device["deviceName"],
          bluetoothAddress: device["deviceAddress"],
          deviceType: "BEACON"
        };

        $scope.server.send(JSON.stringify(bluetoothDevice));
      }
    };

    BluetoothDiscovery.registerObserverCallback($scope.sendMessage);

  })
  .
  controller('AccountCtrl', function ($rootScope, $scope, $ionicPlatform, $cordovaDevice, $cordovaBarcodeScanner, $cordovaBeacon, DeviceRegistration, BluetoothDiscovery, BeaconInfo) {
    $scope.beacons = {};
    //b9407f30-f5f8-466e-aff9-25556b57fe6d
    $ionicPlatform.ready(function () {
      if (window.cordova) {

        //$cordovaBeacon.requestWhenInUseAuthorization();

        /*$rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
          var uniqueBeaconKey;
          for (var i = 0; i < pluginResult.beacons.length; i++) {
            uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
            $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
          }
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        });
        $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "b9407f30-f5f8-466e-aff9-25556b57fe6d"));*/
      }
    });




    $scope.uuid = null;
    $scope.userId = null;
    $scope.showDeviceList = false;
    $scope.devices = [];

    $ionicPlatform.ready(function () {
      if (window.cordova) {

        $scope.uuid = $cordovaDevice.getUUID();
        BeaconInfo.getLocationManager();
        BeaconInfo.masterDeviceId = $scope.uuid;
        BeaconInfo.startScanForBeacons();

        BluetoothDiscovery.bindCordovaEvents();
        /*  BluetoothDiscovery.stopScan();
         BluetoothDiscovery.startScan();*/

      }
    });

    $scope.scan = function () {
      if (window.cordova) {
        $cordovaBarcodeScanner
          .scan()
          .then(function (barcodeData) {
            //"{userName: Bob, primeKey: 12345}"
            var deviceInfo = {};
            var jsonBarCode = JSON.parse(barcodeData.text);
            deviceInfo.userId = jsonBarCode.userId || '562992e0ca9ecba67aa0f95d';
            deviceInfo.devices = [];
            deviceInfo.devices.push({deviceId: $scope.uuid, name: 'My Mobile Phone'});

            for (var d = 0; d < BluetoothDiscovery.devices.length; d++) {
              var device = {};
              device.name = BluetoothDiscovery.devices[d]['deviceName'];
              device.deviceId = BluetoothDiscovery.devices[d]['deviceAddress'];
              deviceInfo.devices.push(device);
            }

            $scope.userName = jsonBarCode.userName || 'Team Citi';
            $scope.devices = deviceInfo.devices;
            $scope.showDeviceList = true;
            DeviceRegistration.saveDeviceInfo(deviceInfo).then(function (success) {
              console.log(success);
              return success;
            }, function (err) {
              console.log(err);
              return null;
            });

            /*  BC.Bluetooth.GetPairedDevices(function (mes) {
             for (var i = 0; i < mes.length; i++) {
             var d = {};
             d.deviceId = mes[i].deviceAddress;
             d.name = mes[i].deviceName || 'beacon';
             deviceInfo.devices.push(d);
             //BluetoothDiscovery.manuallyAddNewDevice(mes[i].deviceAddress);
             }

             });*/
          }, function (error) {
            // An error occurred
          });
      } else {
        console.log("web browser doesn't support scanner");
      }
    };

    $scope.getBluetoothDevices = function () {
      $cordovaBeacon.requestWhenInUseAuthorization();

      $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
        var uniqueBeaconKey;
        for (var i = 0; i < pluginResult.beacons.length; i++) {
          uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
          $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
        }
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    };
  });
