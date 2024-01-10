
const FishChatContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <div style={{ width: '100%', height: '80%', textAlign: 'center', fontSize: 48, fontFamily: 'Inter', fontWeight: '800', wordWrap: 'break-word' }}>
            {children}
        </div>
    );
};

export { FishChatContainer }