import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, CheckCheck } from 'lucide-react-native';

import { Message } from '../types';
import { COLORS } from '../styles/baseStyles';
import { formatTime } from '../utils';

export const SwipeableMessage = ({ item, isMe }: { item: Message, isMe: boolean }) => {
    const renderRightActions = () => (
        <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>
    );

    const renderLeftActions = () => (
        <View style={[styles.timeContainer, { alignItems: 'flex-end' }]}>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>
    );

    return (
        <Swipeable renderRightActions={!isMe ? renderRightActions : undefined} renderLeftActions={isMe ? renderLeftActions : undefined}>
            <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.theirMessageBubble]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    {isMe && (
                        <View style={styles.tickContainer}>
                            {item.status === 'read' ? (
                                <CheckCheck size={16} color={COLORS.read} />
                            ) : (
                                <Check size={16} color="#AAA" />
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    timeContainer: {
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    timeText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    messageBubble: {
        padding: 10,
        borderRadius: 18,
        maxWidth: "80%",
    },
    myMessageBubble: {
        backgroundColor: COLORS.myMessageBubble,
        borderBottomRightRadius: 0,
    },
    theirMessageBubble: {
        backgroundColor: COLORS.theirMessageBubble,
        borderBottomLeftRadius: 0,
    },
    messageText: {
        color: "#FFF",
        fontSize: 16,
    },
    tickContainer: {
        alignSelf: 'flex-end',
        marginTop: 2,
        marginLeft: 4,
    },
});
