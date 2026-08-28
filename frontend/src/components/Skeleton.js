/* eslint-disable */
import './Skeleton.css';

export function SkeletonBox({ width, height, borderRadius, style }) {
  return (
    <div className="skeleton-box" style={{
      width:        width        || '100%',
      height:       height       || 16,
      borderRadius: borderRadius || 8,
      ...style
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <SkeletonBox width={42} height={42} borderRadius={12} />
        <div style={{ flex: 1 }}>
          <SkeletonBox height={14} width="60%" style={{ marginBottom: 6 }} />
          <SkeletonBox height={10} width="40%" />
        </div>
      </div>
      <SkeletonBox height={28} width="70%" style={{ marginBottom: 6 }} />
      <SkeletonBox height={12} width="50%" />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <SkeletonBox width={42} height={42} borderRadius={12} />
        <SkeletonBox width={52} height={22} borderRadius={20} />
      </div>
      <SkeletonBox height={28} width="60%" style={{ marginBottom: 6 }} />
      <SkeletonBox height={12} width="45%" />
    </div>
  );
}

export function SkeletonListe({ nb }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: nb || 4 }).map(function(_, i) {
        return (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <SkeletonBox width={44} height={44} borderRadius={10} />
            <div style={{ flex: 1 }}>
              <SkeletonBox height={14} width="55%" style={{ marginBottom: 6 }} />
              <SkeletonBox height={11} width="35%" />
            </div>
            <SkeletonBox width={80} height={32} borderRadius={8} />
          </div>
        );
      })}
    </div>
  );
}

export function SkeletonLogement() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
      <SkeletonBox height={180} borderRadius={0} />
      <div style={{ padding: 14 }}>
        <SkeletonBox height={16} width="80%" style={{ marginBottom: 8 }} />
        <SkeletonBox height={12} width="50%" style={{ marginBottom: 12 }} />
        <SkeletonBox height={20} width="40%" />
      </div>
    </div>
  );
}

export function SkeletonTexte({ lignes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lignes || 3 }).map(function(_, i) {
        return <SkeletonBox key={i} height={13} width={i === (lignes || 3) - 1 ? '60%' : '100%'} />;
      })}
    </div>
  );
}