import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"

const FishChatMessageInput = ({ onSendMessage, onFileUpload }: { onSendMessage: any, onFileUpload: any }) => {
    return (

        <div style={{ 'display': 'flex', 'alignItems': 'center' }}>
            <label htmlFor="file-upload" style={{ cursor: 'pointer', marginRight: '10px' }}>
                {/* Replace 'IconComponent' with the icon you want to use */}
                {/* <IconComponent /> */}
                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 10L12 3L19 10H14V21H10V10H5Z" fill="currentColor" />
                </svg> */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22,12c0,1.1-0.9,2-2,2c-0.5,0-0.9-0.2-1.3-0.5l-1.1-0.9l-2.9,2.9c-0.3,0.3-0.7,0.5-1.1,0.5H9.5C8.7,15.1,8,14.4,8,13.6
        V10.4C8,9.6,8.7,8.9,9.5,8.9h3.1c0.4,0,0.8,0.2,1.1,0.5l2.9,2.9l1.1-0.9c0.4-0.4,0.8-0.6,1.3-0.6c1.1,0,2,0.9,2,2V12z M9.5,12
        c1.4,0,2.5-1.1,2.5-2.5S10.9,7,9.5,7S7,8.1,7,9.5S8.1,12,9.5,12z" fill="currentColor" />
                </svg>
                <input
                    id="file-upload"
                    type="file"
                    onChange={onFileUpload}
                    style={{ display: 'none' }}
                />
            </label>
            <Input
                type="text"
                placeholder="Type a message..."
                onKeyPress={onSendMessage}
            />
            <Button
                onClick={onSendMessage}
                style={{ marginLeft: "10px" }}  >
                Send
            </Button>
        </div>

    );
};

export { FishChatMessageInput };