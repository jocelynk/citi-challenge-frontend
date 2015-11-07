angular.module('starter.controllers', ['starter.services', 'ngCordova', 'ngCordovaBeacon'])

  .controller('DashCtrl', function ($rootScope, $scope, $timeout, $ionicPlatform, $cordovaDevice, $cordovaBeacon, BluetoothDiscovery) {

    $scope.info = {
      deviceUUID: null,
      wifiSSID: null,
      ipAddress: null,
      bluetoothDevices: [],
      beacons: {}
    };

    $scope.scan = function () {
      $scope.info.bluetoothDevices = BluetoothDiscovery.devices;
      console.log($scope.info);
    };

    $ionicPlatform.ready(function () {

      BluetoothDiscovery.bindCordovaEvents();
   /*   BluetoothDiscovery.stopScan();
      BluetoothDiscovery.startScan();*/

      if (window.cordova) {
        $scope.info.deviceUUID = $cordovaDevice.getUUID();
      }

      navigator.wifi.getWifiInfo(function (wifiInfo) {
        $scope.info.wifiSSID = wifiInfo.connection.SSID;
        $scope.info.ipAddress = wifiInfo.connection.IpAddress;
      }, function (error) {
        console.log(error);
      }, [{}]);

      //b9407f30-f5f8-466e-aff9-25556b57fe6d


    /*  $timeout(function () {
        BC.Bluetooth.GetPairedDevices(function (mes) {
          for (var i = 0; i < mes.length; i++) {
            BluetoothDiscovery.manuallyAddNewDevice(mes[i].deviceAddress);
          }

        });
      }, 20000);*/

      $cordovaBeacon.requestWhenInUseAuthorization();

      $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
        var uniqueBeaconKey;
        for (var i = 0; i < pluginResult.beacons.length; i++) {
          uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
          $scope.info.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
        }
        if(!$scope.$$phase) {
          $scope.$apply();
        }
      });

      $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "b9407f30-f5f8-466e-aff9-25556b57fe6d"));

      var server = new WebSocket("ws://10.128.14.242:9000/ws");

      $scope.account = {};
      $scope.showAccount = false;
      server.onopen = function (event) {
        var obj = {
          event: 'OPEN',
          deviceId: $scope.uuid,
          status: 'INIT'
        };
        server.send(JSON.stringify(obj));
        console.log(event);
      };

      server.onmessage = function (e) {
        var event = JSON.parse(e.data);

        switch (event.event) {
          case 'LOGININIT':
            server.send(JSON.stringify($scope.info));
            break;
          default:
            break;
        }
        if (account.userId) {
          $scope.account.userId = account.userId;
          $scope.showAccount = true;
          if(!$scope.$$phase) {
            $scope.$apply();
          }
        }
      };

      server.onclose = function (event) {
        console.log(event)
      };
    });

  })

  .controller('ChatsCtrl', function ($scope, $ionicPlatform, ProximityProfile) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    Discovery.identify(function (serviceData) {
      console.log(serviceData);
    }, function (error) {
    });

    Discovery.discover(function (serviceData) {
      console.log(serviceData);
    }, function (error) {
    });

    $scope.bindCordovaEvents = function () {
      document.addEventListener('bcready', $scope.onBCReady, false);
    };

    $scope.onNewIBeacon = function (s) {
      var newibeacon = s.target;
      console.log(newibeacon);
    };

    $scope.onBCReady = function () {
      BC.bluetooth.addEventListener("bluetoothstatechange", $scope.onBluetoothStateChange);
      BC.bluetooth.addEventListener("newdevice", $scope.addNewDevice);
      BC.iBeaconManager.addEventListener("newibeacon", $scope.onNewIBeacon);
      if (!BC.bluetooth.isopen) {
        if (API !== "ios") {
          BC.Bluetooth.OpenBluetooth(function () {
          });
        } else {
          //alert("Please open your bluetooth first.");
        }
      }
    };

    $scope.onBluetoothStateChange = function () {
      if (BC.bluetooth.isopen) {

      } else {
        if (API !== "ios") {
          BC.Bluetooth.OpenBluetooth(function () {
          });
        } else {
          //alert("Please open your bluetooth first.");
        }
      }
    };

    $scope.onBluetoothDisconnect = function (arg) {
      BC.Proximity.clearPathLoss();
      navigator.notification.stopBeep();

    };

    $scope.onDeviceConnected = function (arg) {
      var deviceAddress = arg.deviceAddress;

    };

    $scope.addNewDevice = function (s) {
      var newDevice = s.target;
      newDevice.addEventListener("deviceconnected", $scope.onDeviceConnected);
      newDevice.addEventListener("devicedisconnected", $scope.onBluetoothDisconnect);
      console.log(s);

    };

    $scope.onDeviceDisconnected = function () {
      BC.Proximity.clearPathLoss();
      navigator.notification.stopBeep();
    };

    $scope.manuallyAddNewDevice = function (address) {
      var device = BC.bluetooth.devices[address];
      if (device) {
        ProximityProfile.initProximity(device);
        device.addEventListener("deviceconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
        });
        device.addEventListener("devicedisconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
        });
        /*device.connect(function () {

         ProximityProfile.initProximity(device);
         console.log("device is already connected well!");
         }, function(err) {
         console.log(err);
         }, "7A9C3B55-78D0-44A7-A94E-A93E3FE118CE", false);*/
        //device.connect(function(){alert("device is already connected well!");},null,"7A9C3B55-78D0-44A7-A94E-A93E3FE118CE",ture); //connect if the device is classical

      }
    };

    /*SerialPort short UUID = 0x1101
     Long UUID = 00001101-0000-1000-8000-00805F9B34FB*/
    $ionicPlatform.ready(function () {

      $scope.bindCordovaEvents();
      BC.Bluetooth.StopScan();
      BC.Bluetooth.StartScan();

      BC.Bluetooth.GetPairedDevices(function (mes) {
        for (var i = 0; i < mes.length; i++) {
          $scope.manuallyAddNewDevice(mes[i].deviceAddress);
        }

      });
      //http://www.bluecove.org/bluecove/apidocs/javax/bluetooth/UUID.html


    });


  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams) {
  })

  .controller('AccountCtrl', function ($rootScope, $scope, $ionicPlatform, $cordovaDevice, $cordovaBarcodeScanner, $cordovaBeacon, DeviceRegistration, BluetoothDiscovery, ProximityProfile) {
    $scope.beacons = {};

    //b9407f30-f5f8-466e-aff9-25556b57fe6d
    $ionicPlatform.ready(function () {

      $cordovaBeacon.requestWhenInUseAuthorization();

      $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function (event, pluginResult) {
        var uniqueBeaconKey;
        for (var i = 0; i < pluginResult.beacons.length; i++) {
          uniqueBeaconKey = pluginResult.beacons[i].uuid + ":" + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor;
          $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
        }
        $scope.$apply();
      });

      $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("tile", "373BF144-B760-8CC2-9C43-95685B4061A6"));
      $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("tile", "C008F6A9-7CC8-A9B8-995F-D93069032173"));
      $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "b9407f30-f5f8-466e-aff9-25556b57fe6d"));


    });


    $scope.uuid = null;
    $scope.userId = null;
    $scope.showDeviceList = false;
    $scope.devices = [];

    /*var brIdentifier = 'estimote';
     var brUuid = 'C008F6A9-7CC8-A9B8-995F-D93069032173';
     var brMajor = null;
     var brMinor = null;
     var brNotifyEntryStateOnDisplay = true;*/


    $ionicPlatform.ready(function () {
      if (window.cordova) {

        $scope.uuid = $cordovaDevice.getUUID();

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

            BC.Bluetooth.GetPairedDevices(function (mes) {
              for (var i = 0; i < mes.length; i++) {
                var d = {};
                d.deviceId = mes[i].deviceAddress;
                d.name = mes[i].deviceName || 'beacon';
                deviceInfo.devices.push(d);
                //BluetoothDiscovery.manuallyAddNewDevice(mes[i].deviceAddress);
              }
              $scope.userName = jsonBarCode.userName || 'Team Citi';
              $scope.devices = deviceInfo.devices;
              $scope.showDeviceList = true;
              console.log($scope.devices);
              $scope.$apply();
              DeviceRegistration.saveDeviceInfo(deviceInfo).then(function (success) {
                console.log(success);
                return success;
              }, function (err) {
                console.log(err);
                return null;
              });
            });
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
        $scope.$apply();
      });
    };
  });
