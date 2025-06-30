import * as THREE from "three";

export function initStars(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.offsetWidth / container.offsetHeight,
    0.1,
    1000
  );
  camera.position.z = 1;
console.log(THREE)
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 5000;
  const positions = [];

  for (let i = 0; i < starCount; i++) {
    positions.push((Math.random() - 0.5) * 2000);
    positions.push((Math.random() - 0.5) * 2000);
    positions.push(-Math.random() * 2000);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);
    starField.rotation.x += 0.0005;
    starField.rotation.y += 0.0005;
    renderer.render(scene, camera);
  }

  animate();

  return () => {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
