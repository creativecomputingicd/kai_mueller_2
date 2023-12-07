//IMPORT MODULES
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

//CONSTANT & VARIABLES
let width = window.innerWidth;
let height = window.innerHeight;
//-- GUI PARAMETERS
var gui;
const parameters = {
  iterations: 0,
  size: 1
}

//-- SCENE VARIABLES
var scene;
var camera;
var renderer;
var container;
var control;
var ambientLight;
var directionalLight;

//-- GEOMETRY PARAMETERS
//Create an empty array for storing all the cubes
let sceneCubes = [];
let _iter = parameters.iterations;
let rootCube;


function main(){
    //GUI
    gui = new GUI;
    gui.add(parameters, 'iterations', 0, 5, 1);
    gui.add(parameters, 'size', 1, 5, 0.1);

    //CREATE SCENE AND CAMERA
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 10, width / height, 0.1, 1000);
    camera.position.set(45, 45, 45);

    //LIGHTINGS
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight( 0xffffff, 5);
    directionalLight.position.set(2,5,5);
    directionalLight.target.position.set(-1,-1,0);
    scene.add( directionalLight );
    scene.add(directionalLight.target);

    //GEOMETRY INITIATION
    // Initiate first cubes
    rootCube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial());
    scene.add(rootCube);
    createCubes(rootCube, parameters.iterations);

    // Set positions and indices to the BufferGeometry
    const positions = [];
    const indices = [];
    const geometry = new THREE.BufferGeometry();
    
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

    // Create a mesh using the BufferGeometry
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);

    // Add the mesh to the scene
    scene.add(mesh);

    //RESPONSIVE WINDOW
    window.addEventListener('resize', handleResize);
 
    //CREATE A RENDERER
    renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container = document.querySelector('#threejs-container');
    container.append(renderer.domElement);
  
    //CREATE MOUSE CONTROL
    control = new OrbitControls( camera, renderer.domElement );

    //EXECUTE THE UPDATE
    animate();
}

 
//-----------------------------------------------------------------------------------
//HELPER FUNCTIONS
//-----------------------------------------------------------------------------------

//GEOMETRY FUNCTIONS

// Create Cubes
function createCubes(parentCube, level) {
    if (level === 0) {
        return;
    }

    const offset = 1.5; // Abstand der neuen Würfel vom Zentrum des vorherigen Würfels

    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhysicalMaterial();
        material.color = new THREE.Color(0xffffff);
        material.color.setRGB(0, 0, level);

        const cube = new THREE.Mesh(geometry, material);

        // Berechne die Position des neuen Würfels basierend auf der aktuellen Position des Elternwürfels
        const position = new THREE.Vector3();
        position.copy(parentCube.position);
        position.x += (i & 1) ? offset : -offset;
        position.y += (i & 2) ? offset : -offset;
        position.z += (i & 4) ? offset : -offset;

        cube.position.copy(position);
        cube.name = "cube " + level + "-" + i;

        sceneCubes.push(cube);
        scene.add(cube);

        // Rufe die Funktion rekursiv auf, um Würfel auf der nächsten Ebene zu erstellen
        createCubes(cube, level - 1);
    }
}



// Create Cube with recursive function
function createRecursiveCube(iterations, v0, v1, v2, v3, positions, indices) {
    if (iterations === 0) {
        const index = positions.length / 2;
    
        // Vertices for the cube
        positions.push(v0.x, v0.y, v0.z);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
        positions.push(v3.x, v3.y, v3.z);
    
        // Define the cube faces using indices
        indices.push(index, index + 1, index + 2);
        indices.push(index, index + 2, index + 3);
    } else {
        const mid01 = v0.clone().lerp(v1, 0.5);
        const mid12 = v1.clone().lerp(v2, 0.5);
        const mid23 = v2.clone().lerp(v3, 0.5);
        const mid30 = v3.clone().lerp(v0, 0.5);
        const center = mid01.clone().lerp(mid23, 0.5);

        // Recursive calls for the eight sub-cubes
        createRecursiveCube(iterations - 1, v0, mid01, center, mid30, positions, indices);
        createRecursiveCube(iterations - 1, mid01, v1, mid12, center, positions, indices);
        createRecursiveCube(iterations - 1, center, mid12, v2, mid23, positions, indices);
        createRecursiveCube(iterations - 1, mid30, center, mid23, v3, positions, indices);
        
        createRecursiveCube(iterations - 1, v0, mid01, center, mid30, positions, indices);
        createRecursiveCube(iterations - 1, mid01, v1, mid12, center, positions, indices);
        createRecursiveCube(iterations - 1, center, mid12, v2, mid23, positions, indices);
        createRecursiveCube(iterations - 1, mid30, center, mid23, v3, positions, indices);
    }
}






//Remove 3D Objects and clean the caches
function removeObject(sceneObject){
    if (!(sceneObject instanceof THREE.Object3D)) return;

    //Remove the geometry to free GPU resources
    if(sceneObject.geometry) sceneObject.geometry.dispose();

    //Remove the material to free GPU resources
    if(sceneObject.material){
        if (sceneObject.material instanceof Array) {
            sceneObject.material.forEach(material => material.dispose());
        } else {
            sceneObject.material.dispose();
        }
    }

    //Remove object from scene
    sceneObject.removeFromParent();
}

//Remove the cubes
function removeCubes(){
    sceneCubes.forEach(element =>{
        let scene_cube = scene.getObjectByName(element.name);
        removeObject(scene_cube);
    })

    sceneCubes = [];
}

//RESPONSIVE
function handleResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(scene, camera);
}

//ANIMATE AND RENDER
function animate() {
    requestAnimationFrame( animate );

    control.update();

    if(_iter != parameters.iterations){
        _iter = parameters.iterations;

        // Entferne vorherige Würfel
        sceneCubes.forEach(cube => scene.remove(cube));
        sceneCubes = [];

        // Erstelle neue Würfel mit den aktualisierten Iterationen
        createCubes(rootCube, parameters.iterations);
    }

    renderer.render( scene, camera );
}

//-----------------------------------------------------------------------------------
// CLASS
//-----------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// EXECUTE MAIN 
//-----------------------------------------------------------------------------------

main();

