import colors from "ansi-colors";
import { configs } from "triple-beam";
const defaultColors = configs.npm.colors;
const primaryAndInlineTagRegex = /\[([^\]]+)\]/g;
function getBgColorName(color) {
    return `bg${color[0].toUpperCase()}${color.slice(1)}`;
}
function colorizeTextAndTags(textWithTags, textColor, bgColor) {
    return textColor(textWithTags.replaceAll(primaryAndInlineTagRegex, (match, group1) => bgColor("[") + colors.inverse(group1) + bgColor("]")));
}
export function colorizer(bg = true) {
    return {
        transform: (info) => {
            const levelColorKey = defaultColors[info.level];
            const textColor = colors[levelColorKey];
            const bgColor = bg
                ? colors[getBgColorName(levelColorKey)]
                : ((txt) => txt);
            // Colorize all segments separately
            if (typeof info.message === "string") {
                info.message = colorizeTextAndTags(info.message, textColor, bgColor);
            }
            else {
                info.message = info.message.map((msg) => colorizeTextAndTags(msg, textColor, bgColor));
            }
            info.direction = colors.white(info.direction);
            if (info.label) {
                info.label = colors.gray.inverse(info.label);
            }
            if (info.timestamp) {
                info.timestamp = colors.gray(info.timestamp);
            }
            if (info.primaryTags) {
                info.primaryTags = colorizeTextAndTags(info.primaryTags, textColor, bgColor);
            }
            if (info.secondaryTags) {
                info.secondaryTags = colors.gray(info.secondaryTags);
            }
            return info;
        },
    };
}
//# sourceMappingURL=Colorizer.js.map