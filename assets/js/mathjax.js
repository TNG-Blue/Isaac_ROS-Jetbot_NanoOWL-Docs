// ===== MATHJAX CONFIGURATION WITH NAVIGATION SUPPORT =====
window.MathJax = {
    tex: {
        // Input processor options
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,

        // Macro definitions for robotics and engineering
        macros: {
            // Vectors and matrices
            vec: ['\\mathbf{#1}', 1],
            mat: ['\\mathbf{#1}', 1],

            // Common robotics symbols
            pose: ['\\mathbf{T}'],
            rotation: ['\\mathbf{R}'],
            translation: ['\\mathbf{t}'],
            quaternion: ['\\mathbf{q}'],

            // Coordinate frames
            frame: ['^{#1}\\mathbf{#2}', 2],

            // Transformations
            transform: ['{}^{#1}\\mathbf{T}_{#2}', 2],

            // Velocity and acceleration
            velocity: ['\\dot{\\mathbf{#1}}', 1],
            acceleration: ['\\ddot{\\mathbf{#1}}', 1],

            // Angular quantities
            omega: ['\\boldsymbol{\\omega}'],
            alpha: ['\\boldsymbol{\\alpha}'],

            // Common mathematical operations
            norm: ['\\left\\|#1\\right\\|', 1],
            abs: ['\\left|#1\\right|', 1],

            // Isaac ROS specific
            isaac: ['\\textsc{Isaac}'],
            ros: ['\\textsc{ROS}'],
            jetson: ['\\textsc{Jetson}'],

            // Units
            ms: ['\\,\\text{ms}'],
            fps: ['\\,\\text{fps}'],
            hz: ['\\,\\text{Hz}'],
            degrees: ['\\,\\text{°}'],
            radians: ['\\,\\text{rad}'],

            // Mathematical sets
            reals: ['\\mathbb{R}'],
            integers: ['\\mathbb{Z}'],
            naturals: ['\\mathbb{N}'],

            // Special functions
            SE: ['\\text{SE}(#1)', 1],
            SO: ['\\text{SO}(#1)', 1],

            // Control theory
            gain: ['K_{#1}', 1],
            error: ['e_{#1}', 1],

            // SLAM and localization
            landmark: ['\\ell_{#1}', 1],
            observation: ['z_{#1}', 1],
            state: ['x_{#1}', 1],

            // Motor control
            torque: ['\\tau_{#1}', 1],
            current: ['i_{#1}', 1],
            voltage: ['v_{#1}', 1],

            // Probability and statistics
            prob: ['P(#1)', 1],
            given: ['\\,|\\,'],
            expected: ['\\mathbb{E}[#1]', 1],
            variance: ['\\text{Var}[#1]', 1]
        },

        // Tags for equation numbering
        tags: 'ams',
        tagSide: 'right',
        tagIndent: '0.8em',

        // Packages to load
        packages: {
            '[+]': ['ams', 'newcommand', 'configmacros', 'color']
        }
    },

    // SVG output configuration
    svg: {
        fontCache: 'global',
        displayAlign: 'center',
        displayIndent: '0',

        // Responsive scaling
        scale: 1,
        minScale: 0.5,
        mtextInheritFont: false,
        merrorInheritFont: true,
        mathmlSpacing: false,
        skipAttributes: {},
        exFactor: 0.5,

        // Accessibility
        internalSpeechTitles: true,
        titleID: 0
    },

    // Common HTML configuration
    chtml: {
        displayAlign: 'center',
        displayIndent: '0',
        matchFontHeight: false,
        fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
    },

    // Startup configuration
    startup: {
        ready: () => {
            console.log('📐 MathJax loaded and ready for Isaac ROS documentation!');

            // Add custom styling for math elements
            MathJax.startup.document.addStyleSheet({
                // Style inline math
                '.MathJax': {
                    'color': 'var(--md-default-fg-color)',
                    'font-size': '1em'
                },

                // Style display math
                '.MathJax_Display': {
                    'margin': '1em 0',
                    'text-align': 'center'
                },

                // Dark mode support
                '[data-md-color-scheme="slate"] .MathJax': {
                    'color': 'var(--md-default-fg-color--light)'
                }
            });

            // Call the default startup ready function
            MathJax.startup.defaultReady();

            // Initialize helper functions
            initializeMathHelpers();
        },

        // Page ready callback
        pageReady: () => {
            console.log('📊 MathJax page processing complete');

            // Re-process math when new content is loaded
            setTimeout(() => {
                initializeMathHelpers();

                if (typeof window.animationController !== 'undefined') {
                    window.animationController.setupMathAnimations();
                }
            }, 100);
        }
    },

    // Options for processing
    options: {
        // Skip elements with these classes
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],

        // Include elements with these classes
        includeHtmlTags: ['pre'],

        // Render accessibility features
        renderActions: {
            assistiveMml: [],
            speechGenerator: []
        },

        // Menu options
        menuOptions: {
            settings: {
                zoom: 'Double-Click',
                zscale: '150%',
                renderer: 'SVG'
            }
        }
    },

    // Loader configuration
    loader: {
        load: ['[tex]/ams', '[tex]/newcommand', '[tex]/configmacros', '[tex]/color'],

        // Load additional packages as needed
        require: function(name) {
            if (name === 'tikz') {
                return 'https://cdn.jsdelivr.net/npm/tikzjax@latest/dist/tikzjax.js';
            }
            return null;
        }
    }
};

// ===== NAVIGATION-AWARE MATH HELPER INITIALIZATION =====
function initializeMathHelpers() {
    console.log('🧮 Initializing math helpers...');

    // Clean up previous helpers
    cleanupMathHelpers();

    // Add equation numbering for important equations
    addEquationNumbering();

    // Add copy functionality to equations
    addEquationCopyFeature();

    // Add tooltip for complex equations
    addEquationTooltips();
}

function cleanupMathHelpers() {
    // Remove existing copy buttons
    document.querySelectorAll('.math-copy-btn').forEach(btn => btn.remove());

    // Remove equation numbers
    document.querySelectorAll('.equation-number').forEach(num => num.remove());

    // Clear tooltips
    document.querySelectorAll('.MathJax[title]').forEach(el => {
        el.removeAttribute('title');
        el.style.cursor = '';
    });
}

// ===== HELPER FUNCTIONS =====

// Add equation numbering for important equations
function addEquationNumbering() {
    // Wait for MathJax to finish processing
    setTimeout(() => {
        const displayMath = document.querySelectorAll('.MathJax_Display:not([data-numbered])');
        let equationNumber = 1;

        displayMath.forEach(element => {
            // Only number equations marked with data-number attribute
            if (element.hasAttribute('data-number')) {
                element.setAttribute('data-numbered', 'true');

                const numberSpan = document.createElement('span');
                numberSpan.className = 'equation-number';
                numberSpan.textContent = `(${equationNumber})`;
                numberSpan.style.cssText = `
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--md-default-fg-color--light);
                    font-size: 0.9em;
                `;

                element.style.position = 'relative';
                element.appendChild(numberSpan);

                // Add id for referencing
                element.id = `equation-${equationNumber}`;
                equationNumber++;
            }
        });
    }, 500);
}

// Add copy functionality to equations
function addEquationCopyFeature() {
    setTimeout(() => {
        const mathElements = document.querySelectorAll('.MathJax:not([data-copy-setup])');

        mathElements.forEach(element => {
            element.setAttribute('data-copy-setup', 'true');

            // Add copy button on hover
            let copyBtn = null;

            const showCopyButton = () => {
                if (copyBtn) return; // Button already exists

                copyBtn = document.createElement('button');
                copyBtn.className = 'math-copy-btn';
                copyBtn.innerHTML = '📋';
                copyBtn.title = 'Copy LaTeX code';
                copyBtn.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: var(--md-primary-fg-color);
                    color: white;
                    border: none;
                    border-radius: 3px;
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                    cursor: pointer;
                    opacity: 0.8;
                    z-index: 100;
                    transition: opacity 0.2s ease;
                `;

                copyBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const script = element.querySelector('script[type="math/tex"]');
                        const latex = script ? script.textContent : element.textContent;

                        await navigator.clipboard.writeText(latex);
                        copyBtn.innerHTML = '✅';
                        copyBtn.style.background = 'var(--md-accent-fg-color)';

                        setTimeout(() => {
                            copyBtn.innerHTML = '📋';
                            copyBtn.style.background = 'var(--md-primary-fg-color)';
                        }, 1500);
                    } catch (err) {
                        console.error('Failed to copy equation:', err);
                    }
                });

                element.style.position = 'relative';
                element.appendChild(copyBtn);
            };

            const hideCopyButton = () => {
                setTimeout(() => {
                    if (!element.matches(':hover') && copyBtn) {
                        copyBtn.remove();
                        copyBtn = null;
                    }
                }, 500);
            };

            element.addEventListener('mouseenter', showCopyButton);
            element.addEventListener('mouseleave', hideCopyButton);
        });
    }, 500);
}

// Add tooltips for complex equations
function addEquationTooltips() {
    const tooltipDefinitions = {
        '\\mathbf{T}': 'Transformation matrix (4×4 homogeneous)',
        '\\mathbf{R}': 'Rotation matrix (3×3 orthogonal)',
        '\\mathbf{t}': 'Translation vector',
        '\\mathbf{q}': 'Quaternion (w, x, y, z)',
        '\\boldsymbol{\\omega}': 'Angular velocity vector',
        '\\boldsymbol{\\alpha}': 'Angular acceleration vector',
        'SE(3)': 'Special Euclidean group in 3D',
        'SO(3)': 'Special Orthogonal group in 3D',
        '\\tau': 'Torque (motor control)',
        'K_p': 'Proportional gain',
        'K_i': 'Integral gain',
        'K_d': 'Derivative gain'
    };

    setTimeout(() => {
        const mathElements = document.querySelectorAll('.MathJax:not([data-tooltip-setup])');

        mathElements.forEach(element => {
            element.setAttribute('data-tooltip-setup', 'true');

            const script = element.querySelector('script[type="math/tex"]');
            if (script) {
                const latex = script.textContent;

                // Check if equation contains any tooltip-worthy content
                Object.keys(tooltipDefinitions).forEach(pattern => {
                    if (latex.includes(pattern)) {
                        element.title = tooltipDefinitions[pattern];
                        element.style.cursor = 'help';
                    }
                });
            }
        });
    }, 500);
}

// ===== ROBOTICS EQUATION RENDERER =====
class RoboticsEquationRenderer {
    constructor() {
        this.commonEquations = {
            transformationMatrix: {
                latex: '\\mathbf{T} = \\begin{bmatrix} \\mathbf{R} & \\mathbf{t} \\\\ \\mathbf{0}^T & 1 \\end{bmatrix}',
                description: 'Homogeneous transformation matrix'
            },
            quaternionRotation: {
                latex: '\\mathbf{R}(\\mathbf{q}) = \\mathbf{I} + 2q_w[\\mathbf{q}_v]_\\times + 2[\\mathbf{q}_v]_\\times^2',
                description: 'Rotation matrix from quaternion'
            },
            pidController: {
                latex: 'u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}',
                description: 'PID controller output'
            },
            motorTorque: {
                latex: '\\tau = K_t i - b\\omega - \\tau_{friction}',
                description: 'DC motor torque equation'
            },
            kalmanUpdate: {
                latex: '\\mathbf{x}_{k|k} = \\mathbf{x}_{k|k-1} + \\mathbf{K}_k(\\mathbf{z}_k - \\mathbf{H}\\mathbf{x}_{k|k-1})',
                description: 'Kalman filter measurement update'
            }
        };
    }

    renderEquation(equationKey, containerId) {
        const equation = this.commonEquations[equationKey];
        if (!equation) {
            console.warn(`Equation ${equationKey} not found`);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="equation-container">
                <div class="equation-latex">$${equation.latex}$</div>
                <div class="equation-description">${equation.description}</div>
            </div>
        `;

        // Re-render MathJax for this container
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).then(() => {
                console.log(`Equation ${equationKey} rendered successfully`);
                // Reinitialize helpers for new content
                initializeMathHelpers();
            });
        }
    }

    addCustomEquation(key, latex, description) {
        this.commonEquations[key] = { latex, description };
    }
}

// ===== MATH ANIMATION SYSTEM =====
class MathAnimationController {
    constructor() {
        this.animatedEquations = new Set();
    }

    animateEquationReveal(element) {
        if (this.animatedEquations.has(element)) return;

        element.style.opacity = '0';
        element.style.transform = 'scale(0.8) translateY(20px)';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';

        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1) translateY(0)';
        }, 100);

        this.animatedEquations.add(element);
    }

    animateStepByStep(containerId, steps) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let currentStep = 0;

        const showNextStep = () => {
            if (currentStep < steps.length) {
                const stepElement = document.createElement('div');
                stepElement.className = 'math-step';
                stepElement.innerHTML = `$${steps[currentStep]}$`;

                container.appendChild(stepElement);

                // Re-render MathJax for new content
                if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                    MathJax.typesetPromise([stepElement]).then(() => {
                        this.animateEquationReveal(stepElement);
                        currentStep++;

                        if (currentStep < steps.length) {
                            setTimeout(showNextStep, 1500);
                        }
                    });
                }
            }
        };

        showNextStep();
    }

    highlightTerms(equation, terms) {
        // Highlight specific terms in an equation
        terms.forEach(term => {
            const highlighted = `\\colorbox{yellow}{${term}}`;
            equation = equation.replace(new RegExp(term, 'g'), highlighted);
        });

        return equation;
    }

    reset() {
        this.animatedEquations.clear();
    }
}

// ===== INTERACTIVE MATH COMPONENTS =====
class InteractiveMath {
    constructor() {
        this.sliders = new Map();
        this.plots = new Map();
    }

    createParametricEquation(containerId, baseEquation, parameters) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create slider controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'math-controls';

        parameters.forEach(param => {
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';

            const label = document.createElement('label');
            label.textContent = `${param.name}: `;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step || 0.1;
            slider.value = param.default;

            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = param.default;

            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
                this.updateEquation(containerId, baseEquation, parameters);
            });

            sliderContainer.appendChild(label);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(valueDisplay);
            controlsDiv.appendChild(sliderContainer);

            this.sliders.set(param.name, slider);
        });

        // Create equation display
        const equationDiv = document.createElement('div');
        equationDiv.className = 'interactive-equation';
        equationDiv.id = `${containerId}-equation`;

        container.appendChild(controlsDiv);
        container.appendChild(equationDiv);

        // Initial render
        this.updateEquation(containerId, baseEquation, parameters);
    }

    updateEquation(containerId, baseEquation, parameters) {
        let equation = baseEquation;

        parameters.forEach(param => {
            const slider = this.sliders.get(param.name);
            if (slider) {
                const value = parseFloat(slider.value);
                equation = equation.replace(new RegExp(param.placeholder, 'g'), value.toFixed(2));
            }
        });

        const equationDiv = document.getElementById(`${containerId}-equation`);
        equationDiv.innerHTML = `$${equation}$`;

        // Re-render MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([equationDiv]).then(() => {
                initializeMathHelpers();
            });
        }
    }

    reset() {
        this.sliders.clear();
        this.plots.clear();
    }
}

// ===== NAVIGATION-AWARE INITIALIZATION =====
function initializeMathSystem() {
    console.log('🧮 Initializing math system for new page...');

    // Reset existing instances
    if (window.mathAnimations) {
        window.mathAnimations.reset();
    }
    if (window.interactiveMath) {
        window.interactiveMath.reset();
    }

    // Create new instances
    window.roboticsEquations = new RoboticsEquationRenderer();
    window.mathAnimations = new MathAnimationController();
    window.interactiveMath = new InteractiveMath();

    // Add custom CSS for math elements
    addMathCSS();

    console.log('🧮 Math system initialized successfully!');
}

function addMathCSS() {
    if (document.querySelector('#math-styles')) return; // Prevent duplicate styles

    const mathStyles = document.createElement('style');
    mathStyles.id = 'math-styles';
    mathStyles.textContent = `
        .equation-container {
            margin: 2rem 0;
            padding: 1.5rem;
            border: 1px solid var(--md-default-fg-color--lightest);
            border-radius: 8px;
            background: var(--md-code-bg-color);
        }
        
        .equation-description {
            margin-top: 1rem;
            font-style: italic;
            color: var(--md-default-fg-color--light);
            text-align: center;
        }
        
        .math-step {
            margin: 1rem 0;
            opacity: 0;
            transform: translateY(20px);
        }
        
        .math-controls {
            background: var(--md-code-bg-color);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        
        .slider-container {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 0.5rem 0;
        }
        
        .slider-container label {
            min-width: 80px;
            font-weight: 500;
        }
        
        .slider-container input[type="range"] {
            flex: 1;
            margin: 0 1rem;
        }
        
        .slider-container span {
            min-width: 60px;
            text-align: right;
            font-family: var(--md-code-font);
        }
        
        .interactive-equation {
            text-align: center;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        [data-md-color-scheme="slate"] .interactive-equation {
            background: var(--md-code-bg-color);
        }
        
        .MathJax {
            transition: all 0.3s ease;
        }
        
        .MathJax:hover {
            transform: scale(1.02);
        }
        
        .math-copy-btn:hover {
            opacity: 1 !important;
            transform: scale(1.1);
        }
    `;

    document.head.appendChild(mathStyles);
}

// ===== AUTO-INITIALIZATION WITH NAVIGATION SUPPORT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧮 Setting up MathJax navigation hooks...');

    // Initial initialization
    initializeMathSystem();

    // Hook into MkDocs Material navigation
    const mainContent = document.querySelector('[data-md-component="main"]');
    if (mainContent) {
        const observer = new MutationObserver((mutations) => {
            let shouldReinit = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if significant content was added
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE &&
                            (node.classList?.contains('md-content') ||
                                node.querySelector?.('.md-content'))) {
                            shouldReinit = true;
                        }
                    });
                }
            });

            if (shouldReinit) {
                console.log('📄 Navigation detected, reinitializing math system...');
                setTimeout(() => {
                    initializeMathSystem();
                    // Also trigger MathJax re-processing
                    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                        MathJax.typesetPromise().then(() => {
                            initializeMathHelpers();
                        });
                    }
                }, 200);
            }
        });

        observer.observe(mainContent, {
            childList: true,
            subtree: true
        });

        // Store for cleanup
        window.mathNavObserver = observer;
    }

    // Fallback: detect URL changes
    let currentUrl = location.href;
    setInterval(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            console.log('🔄 URL change detected, reinitializing math system...');
            setTimeout(() => {
                initializeMathSystem();
                if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                    MathJax.typesetPromise().then(() => {
                        initializeMathHelpers();
                    });
                }
            }, 300);
        }
    }, 500);
});

// ===== EXPORT FOR GLOBAL ACCESS =====
window.MathJaxConfig = {
    RoboticsEquationRenderer,
    MathAnimationController,
    InteractiveMath,
    addEquationNumbering,
    addEquationCopyFeature,
    addEquationTooltips,
    initializeMathSystem,
    initializeMathHelpers
};

// Make initialization function globally available
window.initializeMathSystem = initializeMathSystem;