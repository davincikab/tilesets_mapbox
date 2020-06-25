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

     // use the three.js GLTF loader to add the 3D model to the three.js scene
     var loader = new THREE.GLTFLoader();
     loader.load('./untitledd.gltf', (function(gltf) {
       gltf.scene.scale.set(0.28, 0.28, 0.28) // scale here
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