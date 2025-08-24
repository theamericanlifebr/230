export function applyCascade(container) {
  [...container.children].forEach((child, idx) => {
    child.classList.add('cascade-item');
    child.style.animationDelay = `${idx * 0.1}s`;
  });
}

export function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
