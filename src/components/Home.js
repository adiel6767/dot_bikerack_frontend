import React from 'react';
import { Container, Row, Col, Button, Card, Nav } from 'react-bootstrap';

function Home() {
    return (
        <Container fluid className="homepage text-center">
        {/* Hero Section */}
        <section className="hero-section" style={{ padding: '120px 0', backgroundColor: '#f8f9fa' }}>
            <Container>
                <h1 style={{ color: '#495057' }}>NYC Bike Rack Assessments</h1>
                <p style={{ color: '#6c757d' }}>Join the community effort to evaluate and improve bike racks across New York City.</p>
            </Container>
        </section>

        {/* Features Section */}
        <section className="features-section" style={{ padding: '40px 0', backgroundColor: '#ffffff' }}>
            <Container>
                <Row>
                    <Col md={4}>
                        <h5 style={{ color: '#495057' }}>Create Assessments</h5>
                        <p style={{ color: '#495057' }}>Rate bike racks and share insights to help keep NYC bike-friendly.</p>
                    </Col>
                    <Col md={4}>
                        <h5 style={{ color: '#495057' }}>Earn Rewards</h5>
                        <p style={{ color: '#495057' }}>Unlock achievements and emblems as you contribute more assessments.</p>
                    </Col>
                    <Col md={4}>
                        <h5 style={{ color: '#495057' }}>Level Up</h5>
                        <p style={{ color: '#495057' }}>Gain experience and recognition for your role in keeping NYC bike-accessible.</p>
                    </Col>
                </Row>
            </Container>
        </section>

        {/* Footer */}
        <footer className="footer" style={{ padding: '20px 0', backgroundColor: '#343a40', color: '#ffffff' }}>
            <Container>
                <Nav className="justify-content-center">
                    <Nav.Link href="/about" style={{ color: '#ffffff' }}>About</Nav.Link>
                    <Nav.Link href="/contact" style={{ color: '#ffffff' }}>Contact</Nav.Link>
                    <Nav.Link href="/privacy" style={{ color: '#ffffff' }}>Privacy</Nav.Link>
                </Nav>
                <p className="text-center" style={{ marginTop: '10px' }}>
                    &copy; 2024 NYC Bike Rack Assessments. All rights reserved.
                </p>
            </Container>
        </footer>
    </Container>

    );
}

export default Home;
