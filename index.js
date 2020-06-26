mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';

var map = window.map = new mapboxgl.Map({
    container: 'map',
    center: [-7.6523817, 33.6004666],
    zoom: 15.42,
    // style: 'mapbox://styles/mapbox/cjf4m44iw0uza2spb3q0a7s41',
    style: 'mapbox://styles/mapbox/light-v10',
    pitch: 60, // pitch in degrees
    bearing: -10, // bearing in degrees
    hash: true
});

var date = new Date();
var time = date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds();
var timeInput = document.getElementById('time');
timeInput.value = time;

timeInput.oninput = () => {
    time = +timeInput.value;
    date.setHours(Math.floor(time / 60 / 60));
    date.setMinutes(Math.floor(time / 60) % 60);
    date.setSeconds(time % 60);
    map.triggerRepaint();
};

map.addControl(new mapboxgl.NavigationControl());

map.on('click', function(e){
  console.log(e);
});

var date = new Date();
    var start = new Date(date.getFullYear(), 0, 1);
    var diff = date - start;

    var day = getDOY(date);
    var time = date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds();



    var timeInput = document.getElementById('time');
    var dayInput = document.getElementById('day');

    dayInput.value = day;
    timeInput.value = time;

    dayInput.oninput = function() {
      day = +dayInput.value;
      date = new Date(start.valueOf());
      date.setDate(day);
      date.setHours(Math.floor(time / 60 / 60));
      date.setMinutes(Math.floor(time / 60) % 60);
      date.setSeconds(time % 60);

      setDirectionalLight();

      // map.triggerRepaint();
      draw();
    }

    timeInput.oninput = function() {
      time = +timeInput.value;
      date.setHours(Math.floor(time / 60 / 60));
      date.setMinutes(Math.floor(time / 60) % 60);
      date.setSeconds(time % 60);

      // console.log(time);
      setDirectionalLight();
      // map.triggerRepaint();
      draw();
    }

// light
function setDirectionalLight(){
  var loc = map.getCenter();
  var sunPos = SunCalc.getPosition(date, loc.lat, loc.lng);
  // console.log(sunPos.altitude);

  console.log(date);
  customLayer.movingLight.position.set(
    -Math.sin(sunPos.azimuth),
    Math.cos(sunPos.azimuth),
    -Math.sin(sunPos.altitude)
  );  

}

function draw() {

  var tr = map.transform;
  var cx = tr.width / 2;
  var cy = tr.height / 2;
  // var r = Math.min(cx, cy) - 5;

  var loc = map.getCenter();
  var sunPos = SunCalc.getPosition(date, loc.lat, loc.lng);
  var sunTimes = SunCalc.getTimes(date, loc.lat, loc.lng);
  var sunAngle = Math.PI / 2 + sunPos.azimuth + tr.angle;
  var sunriseAngle = SunCalc.getPosition(sunTimes.sunrise, loc.lat, loc.lng).azimuth + Math.PI / 2 + tr.angle;
  var sunsetAngle = SunCalc.getPosition(sunTimes.sunset, loc.lat, loc.lng).azimuth + Math.PI / 2 + tr.angle;
  var pitchCos = Math.cos(tr.pitch * Math.PI / 180);

  var m = new Float64Array(16);
  mat4.perspective(m, tr._fov, tr.width / tr.height, 1, 3000);
  mat4.scale(m, m, [1, -1, 1]);
  mat4.translate(m, m, [0, 0, -tr.cameraToCenterDistance]);
  mat4.rotateX(m, m, tr._pitch);
  mat4.rotateZ(m, m, tr.angle);
  mat4.translate(m, m, [-tr.x, -tr.y, 0]);

  var m2 = mat4.create();
  mat4.scale(m2, m2, [tr.width / 2, -tr.height / 2, 1]);
  mat4.translate(m2, m2, [1, -1, 0]);
  mat4.multiply(m, m2, m);

  var coord = tr.pointCoordinate(tr.centerPoint, tr.zoom);
  var p = [
    coord.column * tr.tileSize + Math.sin(-sunPos.azimuth),
    coord.row * tr.tileSize + Math.cos(-sunPos.azimuth), Math.sin(sunPos.altitude), 1
  ];
  vec4.transformMat4(p, p, m);

  var dx = p[0] / p[3] - tr.centerPoint.x;
  var dy = p[1] / p[3] - tr.centerPoint.y;

  var r2 = Math.min(Math.abs(cx / dx), Math.abs(cy / dy)) - 30;



  var isDay = sunPos.altitude > -0.833 * Math.PI / 180;


  map.setLight({
    anchor: 'map',
    position: [1.5, 180 + sunPos.azimuth * 180 / Math.PI, 90 - sunPos.altitude * 180 / Math.PI],
    'position-transition': {
      duration: 0
    }
  }, {
    duration: 0
  });
}

function hideLine(line, icon) {
  line.style.display = 'none';
  if (icon) icon.style.display = 'none';
}


function val(attr, value) {
  if (value !== undefined) {
    attr.baseVal.value = value;
  } else {
    return attr.baseVal.value;
  }
}

map.on('load', draw);
map.on('resize', draw);
map.on('move', draw);


function isLeapYear(date) {
  var year = date.getFullYear();
  if ((year & 3) != 0) return false;
  return ((year % 100) != 0 || (year % 400) == 0);
};

function getDOY(date) {
  var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var mn = date.getMonth();
  var dn = date.getDate();
  var dayOfYear = dayCount[mn] + dn;
  if (mn > 1 && isLeapYear(date)) dayOfYear++;
  return dayOfYear;
};

function pad(num) {
  return num <= 9 ? '0' + num : num;
}


// pixels the map pans when the up or down arrow is clicked
var deltaDistance = 100;

// degrees the map rotates when the left or right arrow is clicked
var deltaDegrees = 25;

function easing(t) {
  return t * (2 - t);
}
var needle = document.getElementById('needle')
map.on('load', function() {
  map.getCanvas().focus();

  map.getCanvas().addEventListener(
    'keydown',
    function(e) {
      e.preventDefault();
      if (e.which === 38) {
        // up
        map.panBy([0, -deltaDistance], {
          easing: easing
        });
      } else if (e.which === 40) {
        // down
        map.panBy([0, deltaDistance], {
          easing: easing
        });
      } else if (e.which === 37) {
        // left
        map.easeTo({
          bearing: map.getBearing() - deltaDegrees,
          easing: easing
        });
        const rat = (deltaDegrees - map.getBearing());
        needle.style.webkitTransform = 'rotate(' + rat + 'deg)';
      } else if (e.which === 39) {
        // right
        map.easeTo({
          bearing: map.getBearing() + deltaDegrees,
          easing: easing
        });
        const rat = (-(deltaDegrees + map.getBearing()));
        needle.style.webkitTransform = 'rotate(' + rat + 'deg)';
      }
    },
    true
  );
});

if (map.scrollWheelZoom) {
  //map.scrollWheelZoom.disable();
}
$(".zoomin").click(function() {
  var zom = map.getZoom();
  map.flyTo({
    zoom: zom - 1
  })
});
$(".zoomout").click(function() {
  var zom = map.getZoom();
  map.flyTo({
    zoom: zom + 1
  })


});

$(".rotate-left").click(function() {
  // left
  map.easeTo({
    bearing: map.getBearing() - deltaDegrees,
    easing: easing
  });
  const rat = (deltaDegrees - map.getBearing());
  needle.style.webkitTransform = 'rotate(' + rat + 'deg)';


});

$(".rotate-right").click(function() {
  map.easeTo({
    bearing: map.getBearing() + deltaDegrees,
    easing: easing
  });
  const rat = (-(deltaDegrees + map.getBearing()));
  needle.style.webkitTransform = 'rotate(' + rat + 'deg)';
});

if (window.matchMedia("(max-width: 992px)").matches) {
  map.setZoom(16.92);
}

// Custom Layer
 // parameters to ensure the model is georeferenced correctly on the map
 var modelOrigin = [-7.6487996503384466, 33.600481117384945];
 var modelAltitude = 0;
 var modelRotate = [Math.PI / 2, 0, 0];

 var modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
   modelOrigin,
   modelAltitude
 );

 // transformation parameters to position, rotate and scale the 3D model onto the map
 var modelTransform = {
   translateX: modelAsMercatorCoordinate.x,
   translateY: modelAsMercatorCoordinate.y,
   translateZ: modelAsMercatorCoordinate.z,
   rotateX: modelRotate[0],
   rotateY: modelRotate[1],
   rotateZ: modelRotate[2],
   /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
   scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
 };

 var THREE = window.THREE;

 // configuration of the custom layer for a 3D model per the CustomLayerInterface
 var customLayer = {
   id: '3d-model',
   type: 'custom',
   renderingMode: '3d',
   onAdd: function(map, gl) {
     this.camera = new THREE.Camera();
     this.scene = new THREE.Scene();
     const color = 0xFCF5E8;

     // create two three.js lights to illuminate the model
     this.directionalLight = new THREE.DirectionalLight(color,0.8);
     this.directionalLight.position.set(0, -7, 10).normalize();
     this.scene.add(this.directionalLight);

     this.directionalLight2 = new THREE.DirectionalLight(color, 0.8);
     this.directionalLight2.position.set(0, 7, 1).normalize();
     this.scene.add(this.directionalLight2);

     this.directionalLight3 = new THREE.DirectionalLight(color, 0.8);
     this.directionalLight3.position.set(-10, 0, -5).normalize();
     this.scene.add(this.directionalLight3);

     this.directionalLight4 = new THREE.DirectionalLight(color, 0.4);
     this.directionalLight4.position.set(10, 0, -5).normalize();
     this.scene.add(this.directionalLight4);

     this.movingLight = new THREE.DirectionalLight(0xffffff, 0.8);
     this.movingLight.position.set(0, 0, 0).normalize();
     this.movingLight.target.position.set(-5,0,0).normalize();

     this.movingLight.castShadow = true;

     this.scene.add(this.movingLight);
     this.scene.add(this.movingLight.target);

     this.ambientLight = new THREE.AmbientLight(0xffffff,0.2);
     this.scene.add(this.ambientLight);

    // texture 
    var textureLoader = new THREE.TextureLoader();
    var newTexture = textureLoader.load('wall.jpg');

    newTexture.encoding = THREE.sRGBEncoding;
    newTexture.flipY = false;
    newTexture.wrapS = THREE.RepeatWrapping;
    newTexture.wrapT = THREE.RepeatWrapping;

     // use the three.js GLTF loader to add the 3D model to the three.js scene
     var loader = new THREE.GLTFLoader();
     loader.load('./untitledd.gltf', (function(gltf) {
       gltf.scene.scale.set(0.28, 0.28, 0.28) // scale here

       gltf.scene.traverse(function(child) {
          if(child instanceof THREE.Mesh) {
            console.log(child);
            child.material.envMap = newTexture;
            child.material.needsUpdate = true;
            // child.material.map.needsUpdate = true;
            
          }
       });

       this.scene.add(gltf.scene);

     }).bind(this));
     this.map = map;



     // use the Mapbox GL JS map canvas for three.js
     this.renderer = new THREE.WebGLRenderer({
       canvas: map.getCanvas(),
       context: gl,
       antialias: true
     });

     this.renderer.autoClear = false;
   },
   render: function(gl, matrix) {
     var rotationX = new THREE.Matrix4().makeRotationAxis(
       new THREE.Vector3(1, 0, 0),
       modelTransform.rotateX
     );
     var rotationY = new THREE.Matrix4().makeRotationAxis(
       new THREE.Vector3(0, 1, 0),
       modelTransform.rotateY
     );
     var rotationZ = new THREE.Matrix4().makeRotationAxis(
       new THREE.Vector3(0, 0, 1),
       modelTransform.rotateZ
     );

     var m = new THREE.Matrix4().fromArray(matrix);
     var l = new THREE.Matrix4()
       .makeTranslation(
         modelTransform.translateX,
         modelTransform.translateY,
         modelTransform.translateZ
       )
       .scale(
         new THREE.Vector3(
           modelTransform.scale,
           -modelTransform.scale,
           modelTransform.scale
         )
       )
       .multiply(rotationX)
       .multiply(rotationY)
       .multiply(rotationZ);

     this.camera.projectionMatrix = m.multiply(l);
     this.renderer.state.reset();
     this.renderer.render(this.scene, this.camera);
     this.map.triggerRepaint();
   }
 };

// load building tile layer
map.on('load', () => {
    map.addLayer(customLayer, 'waterway-label');
    // map.addSource('building', {
    //   type:'geojson',
    //   data:'/my_building.geojson'
    // });

    map.addSource('building', {
      type:'vector',
      url:'mapbox://daudi97.0unvzrfj'
    });

    map.addLayer({
        'id': '3d-buildings',
        'source': 'building',
        // 'source': 'composite',
        'source-layer': 'my_building-5r7lsr',
        'type': 'fill-extrusion',
        'minzoom': 14,
        'paint': {
            'fill-extrusion-color': '#FCF5E8',
            'fill-extrusion-height': ["number", ["get", "height"], 5],
            'fill-extrusion-base': ["number", ["get", "min_height"], 0],
            'fill-extrusion-opacity': 1
        }
    });

    // map.addLayer({
    //   'id':'building_2d',
    //   'type':'fill',
    //   'source':'building',
    //   'layout':{

    //   },
    //   'paint':{
    //     'fill-color':'#ddd'
    //   }
    // });
});