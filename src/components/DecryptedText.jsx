import { useState, useEffect, useRef } from "react";

const defaultChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!?";

const DecryptedText = ({
  text,
  speed = 50,
  maxIterations = 20,
  characters = defaultChars,
  animateOn = "hover", // "hover" or "view"
  revealDirection = "left", // "left", "center"
  className = "",
}) => {
  const [display, setDisplay] = useState("");
  const [revealed, setRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (animateOn === "view") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !revealed) {
            startDecryption();
            setRevealed(true);
          }
        },
        { threshold: 0.6 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, []);

  const startDecryption = () => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplay((prev) =>
        text
          .split("")
          .map((char, i) => {
            if (i < iterations) return text[i];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      iterations += 1 / 3;
      if (iterations >= text.length) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, speed);
  };

  const handleMouseEnter = () => {
    if (animateOn === "hover") startDecryption();
  };

  return (
    <span
      ref={ref}
      onMouseEnter={handleMouseEnter}
      className={`inline-block ${className}`}
    >
      {display || text.split("").map(() => characters[0]).join("")}
    </span>
  );
};

export default DecryptedText;
