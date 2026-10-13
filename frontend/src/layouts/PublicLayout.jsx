/**
 * PublicLayout.jsx — Shared layout for all public static pages
 * Includes fixed responsive PublicHeader, page Outlet, and comprehensive Footer
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const BG = '#0B0F1A';
const TEXT = '#F9FAFB';

export default function PublicLayout() {
  return (
    <div
      style={{
        background: BG,
        color: TEXT,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <PublicHeader />
      <main style={{ flex: 1, paddingTop: 64 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
