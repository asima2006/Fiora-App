type Themes = {
    [theme: string]: {
        primaryColor: string;
        primaryTextColor: string;
        backgroundImage: string;
        aero: boolean;
    };
};

const themes: Themes = {
    default: {
        primaryColor: '41, 98, 255', // Blue #2962ff
        primaryTextColor: '255, 255, 255',
        backgroundImage: '', // No background image
        aero: false,
    },
    dark: {
        primaryColor: '33, 150, 243', // Material Blue #2196f3
        primaryTextColor: '255, 255, 255',
        backgroundImage: '', // No background image
        aero: false,
    },
    'dark-sidebar': {
        primaryColor: '15, 17, 21', // #0f1115
        primaryTextColor: '255, 255, 255',
        backgroundImage: '', // No background image for dark theme
        aero: false,
    },
};

export default themes;
