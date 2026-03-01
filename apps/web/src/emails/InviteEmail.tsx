import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface InviteEmailProps {
    orgName: string;
    inviterName: string;
    inviteUrl: string;
}

export const InviteEmail = ({ orgName, inviterName, inviteUrl }: InviteEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Join {orgName} on FlowDesk</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Join {orgName} on FlowDesk</Heading>
                    <Text style={text}>
                        <strong>{inviterName}</strong> has invited you to join their organization
                        on FlowDesk.
                    </Text>
                    <Section style={btnContainer}>
                        <Button style={button} href={inviteUrl}>
                            Accept Invitation
                        </Button>
                    </Section>
                    <Text style={text}>
                        If you don't want to accept this invitation, you can safely ignore this email.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default InviteEmail;

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
};

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
};

const btnContainer = {
    textAlign: 'center' as const,
};

const button = {
    backgroundColor: '#6366f1',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
};
