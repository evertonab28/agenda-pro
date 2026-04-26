import React, { useState, useEffect } from 'react';
import type { Workspace } from './types';

interface Props {
    workspace: Workspace;
}

// ═══════════════════════════════════════════════════════════════
// Gerador de cores para placeholder
// ═══════════════════════════════════════════════════════════════
const PALETTES = [
    ["#E8927C", "#D4A574", "#C9B99A"],
    ["#7CA5B8", "#95C8D8", "#B8D8E8"],
    ["#A8D8A8", "#8FBC8F", "#6B8E6B"],
    ["#C9A0DC", "#D4B8E8", "#E8D0F0"],
    ["#F0C27F", "#E8A87C", "#D4826A"],
    ["#8899AA", "#99AABB", "#AABBCC"],
    ["#D4A5A5", "#E8B4B8", "#F0C8CC"],
    ["#A5B8D4", "#B4C8E8", "#C8D8F0"],
];

function generateGradient(index: number) {
    const p = PALETTES[index % PALETTES.length];
    const angle = (index * 47 + 15) % 360;
    return `linear-gradient(${angle}deg, ${p[0]}, ${p[1]}, ${p[2]})`;
}

// ═══════════════════════════════════════════════════════════════
// Ícones SVG inline
// ═══════════════════════════════════════════════════════════════
const HeartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const CommentIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const GridIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
);

const ExternalIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

// ═══════════════════════════════════════════════════════════════
// Componente: Post individual
// ═══════════════════════════════════════════════════════════════
function PostCard({ post, index, onClick }: { post: any, index: number, onClick: (p: any) => void }) {
    const [hovered, setHovered] = useState(false);
    const hasImage = post.image && post.image.length > 0;

    return (
        <div
            onClick={() => onClick(post)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                aspectRatio: "1",
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: "2px",
                background: hasImage ? "#1a1a1a" : generateGradient(index),
            }}
        >
            {hasImage && (
                <img
                    src={post.image}
                    alt={post.caption}
                    loading="lazy"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        transform: hovered ? "scale(1.06)" : "scale(1)",
                    }}
                />
            )}
            {!hasImage && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "28px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "-1px",
                }}>
                    {index + 1}
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                    opacity: hovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fff", fontSize: "14px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    <HeartIcon /> {post.likes.toLocaleString()}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fff", fontSize: "14px", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    <CommentIcon /> {post.comments}
                </span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Componente: Modal do post
// ═══════════════════════════════════════════════════════════════
function PostModal({ post, index, workspace, onClose }: { post: any, index: number, workspace: Workspace, onClose: () => void }) {
    const hasImage = post.image && post.image.length > 0;
    const username = workspace.instagram_handle?.replace('@', '') || workspace.slug;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.82)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                animation: "fadeIn 0.2s ease",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    maxWidth: "820px",
                    width: "100%",
                    maxHeight: "80vh",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
                    animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* Imagem */}
                <div style={{
                    flex: "1 1 55%",
                    minHeight: "300px",
                    background: hasImage ? "#000" : generateGradient(index),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    {hasImage ? (
                        <img src={post.image} alt={post.caption} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                        <span style={{ fontSize: "64px", color: "rgba(255,255,255,0.25)", fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
                            {index + 1}
                        </span>
                    )}
                </div>

                {/* Detalhes */}
                <div style={{
                    flex: "1 1 45%",
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "'DM Sans', sans-serif",
                    borderLeft: "1px solid #eee",
                    minWidth: "240px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: workspace.logo_url
                                ? `url(${workspace.logo_url}) center/cover`
                                : "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: "14px", fontWeight: 700,
                        }}>
                            {!workspace.logo_url && username[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#262626" }}>{username}</div>
                        </div>
                    </div>

                    <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#262626", margin: 0, flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{username}</span>{" "}
                        {post.caption}
                    </p>

                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: "16px", marginBottom: "6px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#555" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ed4956" stroke="none">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {post.likes.toLocaleString()} curtidas
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#555" }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#555" stroke="none">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {post.comments} comentários
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            marginTop: "14px",
                            padding: "10px",
                            border: "1px solid #dbdbdb",
                            borderRadius: "8px",
                            background: "transparent",
                            color: "#262626",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "background 0.2s",
                        }}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Componente principal: SocialProofSection
// ═══════════════════════════════════════════════════════════════
export default function SocialProofSection({ workspace }: Props) {
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(6);
    
    const username = workspace.instagram_handle?.replace('@', '') || workspace.slug;
    const instagramUrl = `https://instagram.com/${username}`;

    const realPhotos = workspace.photos || [];
    const displayPhotos = realPhotos.slice(0, visibleCount);
    const hasMore = visibleCount < realPhotos.length;

    return (
        <section className="bg-white border-t border-slate-100 py-16 px-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: scale(1) } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }

                .ig-feed-root * { box-sizing: border-box; margin: 0; padding: 0; }

                .ig-feed-root {
                    max-width: 680px;
                    margin: 0 auto;
                    font-family: 'DM Sans', -apple-system, sans-serif;
                }

                .ig-profile-section {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    padding: 0 0 32px;
                    animation: slideUp 0.5s ease both;
                }

                .ig-avatar {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    background: linear-gradient(135deg, #833AB4, #E1306C, #F77737);
                    padding: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ig-avatar-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .ig-avatar-inner img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .ig-avatar-letter {
                    font-size: 32px;
                    font-weight: 700;
                    color: #833AB4;
                    font-family: 'Playfair Display', serif;
                }

                .ig-profile-info { flex: 1; min-width: 0; }

                .ig-username-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-bottom: 12px;
                }

                .ig-username {
                    font-size: 22px;
                    font-weight: 400;
                    color: #262626;
                }

                .ig-follow-btn {
                    padding: 7px 22px;
                    background: var(--brand-primary, #0095f6);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: opacity 0.2s;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .ig-follow-btn:hover { opacity: 0.9; }

                .ig-stats {
                    display: flex;
                    gap: 24px;
                    margin-bottom: 12px;
                }

                .ig-stat {
                    font-size: 14px;
                    color: #262626;
                }

                .ig-stat strong {
                    font-weight: 700;
                }

                .ig-bio {
                    font-size: 14px;
                    color: #262626;
                    line-height: 1.5;
                }

                .ig-display-name {
                    font-weight: 700;
                    display: block;
                }

                .ig-divider {
                    height: 1px;
                    background: #efefef;
                    margin-top: 16px;
                }

                .ig-tab-bar {
                    display: flex;
                    justify-content: center;
                    padding: 0;
                }

                .ig-tab {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 16px 0;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #262626;
                    border-top: 1px solid #262626;
                    margin-top: -1px;
                }

                .ig-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 4px;
                    padding: 12px 0 24px;
                }

                .ig-load-more {
                    display: block;
                    margin: 0 auto 32px;
                    padding: 10px 32px;
                    border: 1px solid #dbdbdb;
                    border-radius: 8px;
                    background: transparent;
                    color: #262626;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: background 0.2s;
                }

                .ig-load-more:hover {
                    background: #fafafa;
                }

                .ig-footer {
                    text-align: center;
                    padding: 8px 0;
                }

                .ig-footer a {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #8e8e8e;
                    text-decoration: none;
                }

                @media (max-width: 480px) {
                    .ig-profile-section { gap: 20px; }
                    .ig-avatar { width: 77px; height: 77px; }
                    .ig-username { font-size: 18px; }
                    .ig-stats { display: none; }
                }
            `}</style>

            <div className="ig-feed-root">
                <div className="ig-profile-section">
                    <div className="ig-avatar">
                        <div className="ig-avatar-inner">
                            {workspace.logo_url ? (
                                <img src={workspace.logo_url} alt={username} />
                            ) : (
                                <span className="ig-avatar-letter">{username[0]?.toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <div className="ig-profile-info">
                        <div className="ig-username-row">
                            <span className="ig-username">{username}</span>
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ig-follow-btn"
                            >
                                Seguir <ExternalIcon />
                            </a>
                        </div>
                        <div className="ig-stats">
                            <span className="ig-stat"><strong>{realPhotos.length}</strong> publicações</span>
                            <span className="ig-stat"><strong>Membro</strong> Elite</span>
                            <span className="ig-stat"><strong>Perfil</strong> Verificado</span>
                        </div>
                        <div className="ig-bio">
                            <span className="ig-display-name">{workspace.public_name || workspace.name}</span>
                            {workspace.public_description || 'Bem-vindo ao nosso perfil oficial! Agende seu horário pelo link acima.'}
                        </div>
                    </div>
                </div>

                <div className="ig-divider" />

                <div className="ig-tab-bar">
                    <div className="ig-tab">
                        <GridIcon /> Publicações
                    </div>
                </div>

                {realPhotos.length > 0 ? (
                    <>
                        <div className="ig-grid">
                            {displayPhotos.map((photo, i) => (
                                <div key={photo.id} style={{ animation: `slideUp 0.4s ease both ${i * 0.05}s` }}>
                                    <PostCard
                                        post={{
                                            image: photo.url,
                                            likes: (photo.id * 13) % 500 + 50, // Realistic but deterministic numbers
                                            comments: (photo.id * 7) % 50 + 5,
                                            caption: workspace.public_description || workspace.name
                                        }}
                                        index={i}
                                        onClick={(p) => { setSelectedPost(p); setSelectedIndex(i); }}
                                    />
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                className="ig-load-more"
                                onClick={() => setVisibleCount((v) => v + 3)}
                            >
                                Carregar mais
                            </button>
                        )}
                    </>
                ) : (
                    <div className="py-20 text-center animate-in fade-in duration-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-6 border border-slate-100">
                            <InstagramIcon />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">Acompanhe nosso dia a dia</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                            Clique no botão abaixo para ver nosso portfólio completo e novidades diretamente no Instagram.
                        </p>
                        <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                        >
                            <InstagramIcon />
                            Ver Instagram Oficial
                        </a>
                    </div>
                )}

                <div className="ig-footer">
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                        <InstagramIcon />
                        Ver perfil completo no Instagram
                    </a>
                </div>
            </div>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    index={selectedIndex}
                    workspace={workspace}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </section>
    );
}
