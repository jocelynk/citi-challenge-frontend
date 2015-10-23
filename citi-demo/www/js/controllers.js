angular.module('starter.controllers', ['starter.services', 'ngCordova', 'ngCordovaBeacon'])

  .controller('DashCtrl', function ($scope, $ionicPlatform) {
     var server = new WebSocket("ws://10.128.16.213:9000/ws");
    $scope.account = {};
    $scope.showAccount = false;
    server.onopen = function (event) {
      server.send("Message to send");
      console.log(event);

    };

    server.onmessage = function (event) {
      var account = event.data;
      if(account.userId) {
        $scope.account.userId = account.userId;
        $scope.showAccount = true;
        $scope.$apply();
      }
    };

    server.onclose = function(event) {
      console.log(event)
    };


  })

  .controller('ChatsCtrl', function ($scope, Chats, $ionicPlatform) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.chats = Chats.all();
    $scope.remove = function (chat) {
      Chats.remove(chat);
    };

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
      if(device) {
        device.addEventListener("deviceconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
        });
        device.addEventListener("devicedisconnected", function (s) {
          console.log("device:" + s.deviceAddress + "is connected successfully!")
        });
        device.connect(function () {
          console.log("device is already connected well!");
        });
        //device.connect(function(){alert("device is already connected well!");},null,"7A9C3B55-78D0-44A7-A94E-A93E3FE118CE",ture); //connect if the device is classical

      }
    };

    $ionicPlatform.ready(function () {

      $scope.bindCordovaEvents();
      BC.Bluetooth.StopScan();
      BC.Bluetooth.StartScan();

      BC.Bluetooth.GetPairedDevices(function (mes) {
        $scope.manuallyAddNewDevice(mes.deviceAddress);
      });


      /*      BC.Bluetooth.GetConnectedDevices(function(mes){
       $scope.manuallyAddNewDevice(mes.deviceAddress);
       });*/


    });


  })

  .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
  })

  .controller('AccountCtrl', function ($rootScope, $scope, $ionicPlatform, $cordovaDevice, $cordovaBarcodeScanner, $cordovaBeacon, DeviceRegistration, BluetoothDiscovery) {

    $scope.uuid = null;
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
        BluetoothDiscovery.stopScan();
        BluetoothDiscovery.startScan();

      }
    });

    $scope.scan = function () {
      if (window.cordova) {
        $cordovaBarcodeScanner
          .scan()
          .then(function (barcodeData) {
            //"{userName: Bob, primeKey: 12345}"
            var deviceInfo = {};
            deviceInfo.userId = barcodeData.primeKey || '562992e0ca9ecba67aa0f95d';
            deviceInfo.devices = [];

            BC.Bluetooth.GetPairedDevices(function (mes) {
              for (var i = 0; i < mes.length; i++) {
                var d = {};
                d.deviceId = mes[i].deviceAddress;
                d.name = mes[i].deviceName || 'beacon';
                deviceInfo.devices.push(d);
                //BluetoothDiscovery.manuallyAddNewDevice(mes[i].deviceAddress);
              }
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


            /* DeviceRegistration.saveDeviceInfo(deviceInfo).then(function(success) {
             console.log(success);
             return success;
             }, function(err) {
             console.log(err);
             return null;
             });*/
            // Success! Barcode data is here
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
