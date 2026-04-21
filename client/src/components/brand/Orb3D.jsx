import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Orb3D() {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.5, 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const innerGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xf2b857, wireframe: true, transparent: true, opacity: 0.35 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    scene.add(inner);

    const particles = new THREE.Group();
    const pGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xf2b857 });
    for (let i = 0; i < 60; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      const r = 2.1 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
      particles.add(p);
    }
    scene.add(particles);

    let mouseX = 0, mouseY = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseY = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const animate = () => {
      mesh.rotation.x += 0.0025;
      mesh.rotation.y += 0.004;
      inner.rotation.x -= 0.003;
      inner.rotation.y -= 0.0045;
      particles.rotation.y += 0.0015;
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose(); mat.dispose();
      innerGeo.dispose(); innerMat.dispose();
      pGeo.dispose(); pMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className="orb-canvas" aria-hidden />;
}
