import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaHome, FaList, FaFire, FaPlus, FaUser, FaSignInAlt, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Nav = styled.nav`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: background 0.3s;
  white-space: nowrap;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return 'active';
    if (path !== '/' && location.pathname.startsWith(path)) return 'active';
    return '';
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Title>Ajou Campus Foodmap</Title>
        <NavContainer>
          <Nav>
            <NavLink to="/" className={isActive('/')}>
              <FaHome /> Home
            </NavLink>
            <NavLink to="/list" className={isActive('/list')}>
              <FaList /> 맛집 목록
            </NavLink>
            <NavLink to="/popular" className={isActive('/popular')}>
              <FaFire /> 인기 맛집
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/manage-restaurants" className={isActive('/manage-restaurants')}>
                <FaPlus /> 맛집 등록·관리
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/submit" className={isActive('/submit')}>
                <FaPlus /> 맛집 제보
              </NavLink>
            )}
          </Nav>

          <UserSection>
            {loading ? (
              <div style={{ padding: '0.5rem 1rem' }}>로딩중...</div>
            ) : isAuthenticated ? (
              <>
                {user && (
                  <UserInfo>
                    {user.avatar && <UserAvatar src={user.avatar} alt={user.name} />}
                    <span>{user.name}님</span>
                  </UserInfo>
                )}
                <NavLink to="/dashboard" className={isActive('/dashboard')}>
                  <FaUser /> 대시보드
                </NavLink>
                <LogoutButton onClick={handleLogout}>
                  <FaSignOutAlt /> 로그아웃
                </LogoutButton>
              </>
            ) : (
              <>
                <NavLink to="/login" className={isActive('/login')}>
                  <FaSignInAlt /> 로그인
                </NavLink>
                <NavLink to="/register" className={isActive('/register')}>
                  <FaUserPlus /> 회원가입
                </NavLink>
              </>
            )}
          </UserSection>
        </NavContainer>
      </HeaderContent>
    </HeaderContainer>
  );
}

export default Header;
