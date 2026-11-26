import React from 'react';

const WINDOW_X = Array.from({length: 11}, (_, i) => -1.7 + i * 0.36);
export const FOCAL_WINDOW = 6; // index of the window we zoom into

/** Toy airliner built from primitives. Fuselage axis = x, nose toward +x, windows face +z. */
export const Airliner: React.FC<{ring?: number}> = ({ring = 0}) => (
  <group>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <capsuleGeometry args={[0.62, 3.6, 12, 32]} />
      <meshStandardMaterial color="#f1f4f8" roughness={0.42} />
    </mesh>
    {/* tapered tail */}
    <mesh rotation={[0, 0, Math.PI / 2]} position={[-2.85, 0.06, 0]} castShadow>
      <coneGeometry args={[0.56, 1.5, 32]} />
      <meshStandardMaterial color="#f1f4f8" roughness={0.42} />
    </mesh>
    {/* vertical fin + stabilisers */}
    <mesh position={[-2.75, 0.85, 0]} rotation={[0, 0, -0.25]} castShadow>
      <boxGeometry args={[0.9, 1.05, 0.09]} />
      <meshStandardMaterial color="#e2574c" roughness={0.5} />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[-2.85, 0.12, s * 0.7]} rotation={[0, -s * 0.5, 0]} castShadow>
        <boxGeometry args={[0.7, 0.06, 1.5]} />
        <meshStandardMaterial color="#dfe5ec" roughness={0.5} />
      </mesh>
    ))}
    {/* swept wings + engines */}
    {[1, -1].map((s) => (
      <group key={s}>
        <mesh position={[0.1, -0.28, s * 1.45]} rotation={[0, -s * 0.5, 0]} castShadow>
          <boxGeometry args={[1.5, 0.09, 2.7]} />
          <meshStandardMaterial color="#dfe5ec" roughness={0.5} />
        </mesh>
        <mesh position={[0.55, -0.62, s * 1.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.8, 24]} />
          <meshStandardMaterial color="#c3ccd6" roughness={0.4} />
        </mesh>
        <mesh position={[0.96, -0.62, s * 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial color="#2b3a4d" />
        </mesh>
      </group>
    ))}
    {/* cabin windows */}
    {WINDOW_X.map((x, i) => (
      <mesh key={x} position={[x, 0.14, 0.603]}>
        <boxGeometry args={[0.13, 0.2, 0.05]} />
        <meshStandardMaterial
          color={i === FOCAL_WINDOW ? '#8fc4ff' : '#2b3a4d'}
          emissive={i === FOCAL_WINDOW ? '#6fb7ff' : '#000000'}
          emissiveIntensity={i === FOCAL_WINDOW ? 0.5 : 0}
          roughness={0.3}
        />
      </mesh>
    ))}
    {/* gold highlight ring around the focal window */}
    {ring > 0.01 ? (
      <mesh position={[WINDOW_X[FOCAL_WINDOW], 0.14, 0.64]} scale={0.8 + ring * 0.5}>
        <torusGeometry args={[0.17, 0.016, 12, 40]} />
        <meshStandardMaterial color="#ffcf4a" emissive="#ffcf4a" emissiveIntensity={0.9 * ring} transparent opacity={ring} />
      </mesh>
    ) : null}
  </group>
);
