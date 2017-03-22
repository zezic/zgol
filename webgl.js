var THREE = require("three-js")();
var TWEEN = require('tween.js');

var scene, camera, renderer;
var geometry, material, mesh, texture;
var field_size = 160;
var planes = [];
var cell_size = 6;

var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');
canvas.width = canvas.height = field_size;

renderer = new THREE.WebGLRenderer({
  antialias: true
});
camera = new THREE.PerspectiveCamera( 77, window.innerWidth / window.innerHeight, 1, 10000 );
scene = new THREE.Scene();
texture = new THREE.Texture(canvas);

module.exports.planes = planes;
module.exports.canvas = canvas;
module.exports.ctx = ctx;
module.exports.field_size = field_size;
module.exports.renderer = renderer;
module.exports.camera = camera;
module.exports.scene = scene;
module.exports.texture = texture;


geometry = new THREE.PlaneGeometry( field_size*cell_size, field_size*cell_size );
material = new THREE.MeshBasicMaterial( { color: 0x222222, wireframe: true } );

init();
animate();

var color_in = new THREE.Color( 0xff0000 );
var color_out = new THREE.Color( 0x0000ff );
var tween = new TWEEN.Tween(color_in).to(color_out, 2000);
tween.repeat(Infinity);
tween.yoyo(true);
tween.start();

tween.onUpdate(function() {
  var color = this;
  planes.map(function(row) {
    row.map(function(plane) {
      //plane.material.color.set(color);
    });
  });
});

function init() {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    var mtrl = new THREE.MeshBasicMaterial({ map: texture });

    camera.position.z = 1000;

    //for (var y = 0; y < field_size; y = y + 1) {
      //planes.push([]);
      //for (var x = 0; x < field_size; x = x + 1) {
        //var mesh = new THREE.Mesh( geometry, material );
        //mesh.position.set(
          //x*cell_size-(field_size*cell_size)/2+cell_size/2,
          //(y*cell_size-(field_size*cell_size)/2+cell_size/2)*-1,
          //0
        //);
        //mesh.userData.x = x;
        //mesh.userData.y = y;
        //scene.add( mesh );
        //planes[planes.length-1].push(mesh);
      //}
    //}
    //geometry = new THREE.BoxGeometry( 200, 200, 200 );
    mesh = new THREE.Mesh( geometry, mtrl );
    scene.add( mesh );

    renderer.setSize(1280, 1280);
    renderer.setClearColor(0x141414);

    document.body.appendChild( renderer.domElement );

}

function animate() {


    //mesh.rotation.x += 0.01;
    //mesh.rotation.y += 0.02;

    //mesh.material.color.set( color )

    //TWEEN.update();


    requestAnimationFrame( animate );
    //texture.needsUpdate = true;
    //mesh.rotation.y += 0.01;
    renderer.render( scene, camera );

}
