import React, { useState, useRef, useEffect } from 'react';
import Picker, { Theme } from 'emoji-picker-react';
import './ReactionPicker.css'; // CSS for proper positioning
import { ButtonBase } from '@mui/material';

export const ReactionPicker = ({ onReaction }) => {
  const [showPicker, setShowPicker] = useState(false); // Manage picker visibility
  const pickerRef = useRef(null); // Reference to the picker

  const handleReaction = (emojiObject) => {
    onReaction(emojiObject.emoji);  // Handle the selected emoji reaction
    setShowPicker(false); // Close picker after selection
  };
  const handlePicker = (emojiObject) => {
    
    onReaction(emojiObject.emoji);  // Handle the selected emoji reaction
    setShowPicker(false); // Close picker after selection
  };

  // Close picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false); // Close picker
      }
    };

    // Add event listener when picker is shown
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="reaction-container">
      {/* Emoji CTA */}
      <ButtonBase sx={{
        fontSize: '22px'
      }} onClick={() => setShowPicker(!showPicker)}>
        😃
      </ButtonBase>

      {/* Emoji Picker with dark theme */}
      {showPicker && (
        <div className="emoji-picker" ref={pickerRef}>
          <Picker
            reactionsDefaultOpen={true}
            onReactionClick={handleReaction}
            onEmojiClick={handlePicker}
            allowExpandReactions={true}
            theme={Theme.DARK} 
          />
        </div>
      )}
    </div>
  );
};