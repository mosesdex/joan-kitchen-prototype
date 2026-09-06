import { Skeleton } from '../components/ui'

/** Shown while a lazily-loaded surface is fetched. */
export function SurfaceSkeleton() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-0)', padding: 'var(--space-8)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 1080 }}>
        <Skeleton width={220} height={28} />
        <Skeleton width={340} height={14} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-4)',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={104} radius={12} />
          ))}
        </div>
        <Skeleton height={280} radius={12} />
      </div>
    </div>
  )
}
