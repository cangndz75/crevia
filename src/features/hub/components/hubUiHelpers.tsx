import { Text, type TextStyle } from 'react-native';

/** Metinde **kalın** parçaları ayırır */
export function renderHighlightedText(
  text: string,
  baseStyle: TextStyle,
  highlightStyle: TextStyle,
) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
          <Text key={index} style={[baseStyle, highlightStyle]}>
            {part.slice(2, -2)}
          </Text>
      );
    }
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}
