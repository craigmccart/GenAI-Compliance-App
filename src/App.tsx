import React, { useState, useMemo } from 'react';
import { Database, Brain, Server, Scale, Gavel, BarChart3, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

// Define maturity levels globally for use in ResultsScreen and PDF report
const MATURITY_LEVELS = [
  { name: 'Initial', minScore: 0, colorName: 'red', description: 'Basic AI security policies may be emerging, but significant gaps exist. Your organisation should focus on establishing foundational controls and awareness.' },
  { name: 'Developing', minScore: 21, colorName: 'amber', description: 'Basic AI security policies are in place, but significant gaps remain. Your organisation should focus on formalising processes and expanding controls.' },
  { name: 'Defined', minScore: 41, colorName: 'yellow', description: 'AI security processes are formally defined and documented. Consistent implementation across projects is the next key area of focus.' },
  { name: 'Managed', minScore: 61, colorName: 'sky', description: 'AI security is actively managed with quantitative insights. Proactive measures are in place, and continuous improvement is a goal.' },
  { name: 'Optimising', minScore: 81, colorName: 'green', description: 'AI security practices are mature and continuously optimised using data-driven insights and predictive analytics. You are a leader in AI security.' },
];

// Definitions for PDF Report Generation
// Updated to return full maturity object including colorName
const getMaturityDataForPdf = (percentage: number): { name: string; minScore: number; colorName: string; description: string } => {
  for (let i = MATURITY_LEVELS.length - 1; i >= 0; i--) {
    if (percentage >= MATURITY_LEVELS[i].minScore) {
      return MATURITY_LEVELS[i];
    }
  }
  return MATURITY_LEVELS[0];
};

const getDomainInsightTagForPdf = (progress: number): string => {
  if (progress >= 67) return 'Strength';
  if (progress >= 34) return 'Developing';
  return 'Priority Focus';
};


// Interface for Dynamic Recommendations
interface Recommendation {
  id: string; // To link with question triggers
  title: string;
  description: string; // Explain issue and DevSecAI's solution
  serviceLink: string; // Link to specific DevSecAI service page
  priority: 'high' | 'medium' | 'low';
  complianceAreaId?: string; // ID of the compliance area this recommendation relates to
}

const allPossibleRecommendations: Recommendation[] = [
  {
    id: 'REC_DATA_GOVERNANCE',
    title: 'Strengthen Data Governance & Privacy Frameworks',
    description: "Your responses indicate potential gaps in data handling and privacy policies for AI systems. DevSecAI's Data Governance service helps establish robust frameworks, ensuring compliance with regulations like GDPR, CCPA, and managing data lifecycle for AI.",
    serviceLink: 'https://www.devsecai.io/services/data-governance', // Placeholder link
    priority: 'high',
    complianceAreaId: 'discovery',
  },
  {
    id: 'REC_MODEL_SECURITY',
    title: 'Enhance AI Model Security & Integrity',
    description: "Concerns regarding AI model security, including vulnerability to adversarial attacks or lack of integrity checks, were noted. DevSecAI offers AI Model Security assessments and hardening services to protect your valuable AI assets.",
    serviceLink: 'https://www.devsecai.io/services/model-security', // Placeholder link
    priority: 'high',
    complianceAreaId: 'security', // Changed from 'discovery'
  },
  {
    id: 'REC_AI_RED_TEAMING',
    title: 'Proactive AI System Security Testing (Red Teaming)',
    description: "Identify and mitigate vulnerabilities in your AI systems before attackers do. DevSecAI's AI Red Teaming service simulates real-world attacks, providing actionable insights to enhance your AI defenses.",
    serviceLink: 'https://www.devsecai.io/services/ai-red-teaming', // Placeholder link
    priority: 'high',
    complianceAreaId: 'security', // Changed from 'development'
  },
  {
    id: 'REC_COMPLIANCE_AUTOMATION',
    title: 'Automate & Streamline Compliance Monitoring',
    description: "Manual compliance tracking for AI can be error-prone and inefficient. DevSecAI's Compliance Automation solutions help implement continuous monitoring and reporting for your AI systems, reducing overhead and ensuring ongoing adherence.",
    serviceLink: 'https://www.devsecai.io/services/compliance-automation', // Placeholder link
    priority: 'medium',
    complianceAreaId: 'governance',
  },
  {
    id: 'REC_EU_AI_ACT_PREP',
    title: 'Prepare for EU AI Act Obligations',
    description: "Your responses suggest a need to formalize your approach to the EU AI Act, including risk classification, conformity assessments, and technical documentation. DevSecAI provides expert guidance to navigate these complex requirements and ensure your AI systems are compliant.",
    serviceLink: 'https://www.devsecai.io/services/eu-ai-act-readiness',
    priority: 'high',
    complianceAreaId: 'regulation',
  },
  {
    id: 'REC_FRIA_IMPLEMENTATION',
    title: 'Implement Fundamental Rights Impact Assessments (FRIA)',
    description: "Assessing the impact of AI systems on fundamental rights is crucial, especially under the EU AI Act. DevSecAI can help you conduct thorough FRIAs, identify potential harms, and implement mitigation strategies to ensure responsible AI deployment.",
    serviceLink: 'https://www.devsecai.io/services/fria-assessment',
    priority: 'high',
    complianceAreaId: 'impact',
  },
  {
    id: 'REC_DATA_PROTECTION_ENHANCEMENT',
    title: 'Enhance Data Protection & Privacy Practices',
    description: "Ensuring robust data protection for personal data used in AI systems is critical (e.g., GDPR, HIPAA). DevSecAI helps implement data minimization, purpose limitation, and security measures for data used in AI, and establish DPAs.",
    serviceLink: 'https://www.devsecai.io/services/data-protection',
    priority: 'high',
    complianceAreaId: 'data',
  },
  {
    id: 'REC_ETHICAL_AI_FRAMEWORK',
    title: 'Establish an Ethical AI Framework & Oversight',
    description: "Beyond compliance, establishing clear ethical guidelines and human oversight for AI development and deployment fosters trust and responsible innovation. DevSecAI assists in creating tailored ethical AI frameworks and governance structures.",
    serviceLink: 'https://www.devsecai.io/services/ethical-ai-framework',
    priority: 'medium',
    complianceAreaId: 'ethics',
  },
  {
    id: 'REC_AI_READINESS_CAPABILITY',
    title: 'Bolster AI Capability & Technical Readiness',
    description: "Comprehensive technical documentation and organisational readiness are key for managing AI systems effectively and meeting regulatory demands (e.g., EU AI Act). DevSecAI helps build internal capabilities and prepare necessary documentation.",
    serviceLink: 'https://www.devsecai.io/services/ai-capability-building',
    priority: 'medium',
    complianceAreaId: 'capability',
  },
];


// Interface for ComplianceAreaInsight used in ResultsScreenProps
interface ComplianceAreaInsight {
  id: string;
  name: string;
  progress: number;
  icon: React.ReactNode;
  color: string; // Added for results screen styling
}

// Props for ResultsScreen component
interface ResultsScreenProps {
  setShowEmailModal: (show: boolean) => void; // Changed: To open email modal
  handleResetAssessment: () => void;
  overallCompletionPercentage: number;
  complianceAreaInsightsData: ComplianceAreaInsight[];
  recommendations: Recommendation[]; // For dynamic recommendations
}

// Results screen component for displaying assessment results
const ResultsScreen: React.FC<ResultsScreenProps> = ({
  setShowEmailModal, // Changed
  handleResetAssessment,
  overallCompletionPercentage,
  complianceAreaInsightsData,
  recommendations,
}) => {
  // maturityLevels is now a global constant MATURITY_LEVELS
  const getMaturityLevel = (percentage: number) => {
    for (let i = MATURITY_LEVELS.length - 1; i >= 0; i--) {
      if (percentage >= MATURITY_LEVELS[i].minScore) {
        return { ...MATURITY_LEVELS[i], stageIndex: i };
      }
    }
    return { ...MATURITY_LEVELS[0], stageIndex: 0 }; // Default to Initial
  };

  const currentMaturity = getMaturityLevel(overallCompletionPercentage);

  const getDomainInsightStatus = (progress: number) => {
    if (progress >= 67) return { textColor: 'text-green-400', tagBgColor: 'bg-green-500', tag: 'Strength' };
    // For 'Developing', let's use a distinct amber/orange to avoid clash if an area color is yellow
    if (progress >= 34) return { textColor: 'text-amber-400', tagBgColor: 'bg-amber-500', tag: 'Developing' }; 
    return { textColor: 'text-red-400', tagBgColor: 'bg-red-500', tag: 'Priority Focus' };
  };

  return (
      <div className="max-w-screen-2xl w-full mx-auto">
        {/* Header: Re-add if a specific header is needed, current logo is in App.tsx main */}
        {/* <img src={LogoTransparent} alt="DevSecAI Logo" className="h-12 mx-auto mb-8" /> */}
        <h1 className={`text-2xl font-bold mb-1 text-emerald-400 mb-2`}>GenAI Privacy & Compliance Assessment</h1>
        <p className="text-center text-gray-400 mb-10">Your comprehensive GenAI Privacy & Compliance Report.</p>

        {/* Overall AI Security Maturity */}
        <div className="bg-[#202938] p-6 rounded-lg shadow-xl mb-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-emerald-300">Overall AI Security Maturity</h2>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-${currentMaturity.colorName}-500 ${currentMaturity.colorName === 'yellow' || currentMaturity.colorName === 'amber' ? 'text-black' : 'text-white'}`}>
              {currentMaturity.name}
            </span>
          </div>
          <p className="text-gray-300 mb-6 text-sm">
            {currentMaturity.description}
          </p>
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              {MATURITY_LEVELS.map(level => <span key={level.name}>{level.name}</span>)}
            </div>
            <div className="bg-gray-700 rounded-full h-4 relative flex items-center">
              {MATURITY_LEVELS.map((level, index) => (
                <div key={level.name} className={`h-full flex-1 ${index <= currentMaturity.stageIndex ? 'bg-' + level.colorName + '-500' : 'bg-gray-600'} ${index === 0 ? 'rounded-l-full' : ''} ${index === MATURITY_LEVELS.length - 1 ? 'rounded-r-full' : ''}`}></div>
              ))}
               <div className="absolute top-0 h-4 bg-transparent flex items-center" style={{ width: `${overallCompletionPercentage}%`}}>
                 <div className="w-1 h-6 bg-white rounded-full -ml-0.5 shadow-lg"></div> {/* Current progress marker */} 
               </div>
            </div>
             <p className="text-right text-xs text-emerald-400 mt-1">{overallCompletionPercentage.toFixed(0)}% Complete</p>
          </div>
        </div>

        {/* Key Domain Insights */}
        <div className="bg-[#202938] p-6 rounded-lg shadow-xl mb-10">
          <h2 className="text-xl font-semibold text-emerald-300 mb-6">Key Domain Insights</h2>
          <div className="space-y-5">
            {complianceAreaInsightsData.map(area => {
              const status = getDomainInsightStatus(area.progress);
              return (
                <div key={area.id} className="p-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span className="mr-3" style={{ color: area.color }}>{area.icon}</span>
                      <span className="text-md font-medium text-gray-100">{area.name}</span>
                    </div>
                    {status.tag && <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status.tagBgColor} bg-opacity-20 ${status.textColor}`}>{status.tag}</span>}
                  </div>
                  <div className={`w-full rounded-full h-2.5 bg-gray-700`}> {/* Consistent dark track color */}
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${area.progress.toFixed(0)}%`, backgroundColor: area.color }}
                    ></div>
                  </div>
                  <div className={`text-right text-xs ${status.textColor} mt-1`}>{area.progress.toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Recommendations */}
        <div className="bg-[#202938] p-6 rounded-lg shadow-xl mb-10">
          <h2 className="text-xl font-semibold text-emerald-300 mb-6">Priority Recommendations</h2>
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div key={index} className={`bg-[#1E293B] p-4 md:p-6 rounded-lg shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between border-l-4 ${rec.complianceAreaId && complianceAreaInsightsData.find(insight => insight.id === rec.complianceAreaId) ? 'border-' + complianceAreaInsightsData.find(insight => insight.id === rec.complianceAreaId)!.color + '-500' : 'border-gray-500'}`}>
                <div>
                  <div className="flex items-center mb-2">
                     <span className="bg-emerald-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold mr-3">{index + 1}</span>
                     <h3 className="text-lg font-medium text-gray-100">{rec.title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 md:mb-0 md:ml-9">{rec.description}</p>
                </div>
                <a 
                  href="https://www.devsecai.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 md:mt-0 md:ml-4 flex-shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Start Now {/* Later: Add ExternalLinkIcon */}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps & Actions */}
        <div className="bg-[#202938] p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-emerald-300 mb-1">Next Steps</h2>
          <p className="text-gray-400 text-sm mb-6">Contact DevSecAI for a comprehensive AI security roadmap tailored to your organisation’s specific needs, priorities, and budget constraints.</p>
          
          <button
            onClick={() => setShowEmailModal(true)}
            className="w-full px-6 py-3 bg-emerald-500 text-white rounded-md font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-3"
          >
            <FileText size={20} /> Download Full Report
          </button>

          <button
            onClick={handleResetAssessment}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {/* Later: Add RefreshCcwIcon */} New Assessment
          </button>
        </div>

      </div> /* End max-w-screen-2xl (formerly max-w-4xl), now the root of ResultsScreen */
  );
};

interface ComplianceArea {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string; // Added for styling compliance areas
}

interface Question {
  id: string;
  text: string;
  options: string[];
  info?: string;
  article?: string;
  complianceAreaId: string;
  framework?: string;
  priority?: 'high' | 'medium' | 'low';
  documentationRequired?: boolean;
  regions?: string[]; // Added for regional relevance
  recommendationTriggerId?: string; // ID for linking to a specific recommendation
  triggerOptionValues?: string[]; // Specific answer values that trigger the recommendation
}

const questions: Question[] = [
  // Discovery Domain
  {
    id: 'genAiInventory',
    text: 'Are all GenAI models and systems (in use or development) inventorised?',
    options: ['Yes, fully', 'Partially', 'No, in progress', 'No, not started'],
    info: 'A full inventory is key to understanding scope and potential risks.',
    complianceAreaId: 'discovery',
    priority: 'high',
    recommendationTriggerId: 'REC_DATA_GOVERNANCE',
    triggerOptionValues: ['Partially', 'No, in progress', 'No, not started']
  },
  {
    id: 'dataSourcesGenAi',
    text: 'Are data sources (training, fine-tuning, RAG) for GenAI models documented and assessed for bias or quality?',
    options: ['Yes, fully documented & assessed', 'Partially documented/assessed', 'Documented, not assessed', 'No'],
    info: 'Data lineage and quality understanding is key under the EU AI Act.',
    complianceAreaId: 'discovery',
    priority: 'high',
    recommendationTriggerId: 'REC_DATA_GOVERNANCE',
    triggerOptionValues: ['Partially documented/assessed', 'Documented, not assessed', 'No']
  },
  {
    id: 'modelPurposeGenAi',
    text: 'Is each GenAI system\'s purpose and operational context clearly defined and documented?',
    options: ['Yes, for all systems', 'For most systems', 'For some systems', 'No'],
    info: 'Defining the purpose helps in risk classification and conformity assessment.',
    complianceAreaId: 'discovery',
    priority: 'medium',
    recommendationTriggerId: 'REC_DATA_GOVERNANCE',
    triggerOptionValues: ['For some systems', 'No']
  },
  {
    id: 'thirdPartyGenAi',
    text: 'If using third-party GenAI models/APIs (e.g., LLMs), are their compliance and risk profiles understood?',
    options: ['Yes, fully understood', 'Yes, partially understood', 'Yes, but not understood', 'No third-party models used'],
    info: 'Third-party component responsibilities must be clear.',
    complianceAreaId: 'discovery',
    priority: 'high',
    recommendationTriggerId: 'REC_MODEL_SECURITY',
    triggerOptionValues: ['Yes, partially understood', 'Yes, but not understood']
  },
  {
    id: 'systemBoundariesGenAi',
    text: 'Are system boundaries and integration points for GenAI applications with other enterprise systems defined?',
    options: ['Yes, clearly defined', 'Partially defined', 'In progress', 'No'],
    info: 'Clear boundaries are vital for security and impact assessment.',
    complianceAreaId: 'discovery',
    priority: 'medium'
  },

  // Regulation Domain
  {
    id: 'euAiActApplicability',
    text: 'Do your GenAI systems fall under the EU AI Act\'s scope?',
    options: ['Yes, determined', 'No, assessment pending', 'Unsure', 'Not applicable (outside EU market/impact)'],
    info: 'The EU AI Act applies to providers, deployers, importers, and distributors of AI systems in the EU.',
    complianceAreaId: 'regulation',
    priority: 'high',
    regions: ['EU'], // EU AI Act specific
    recommendationTriggerId: 'REC_COMPLIANCE_AUTOMATION',
    triggerOptionValues: ['No, assessment pending', 'Unsure']
  },
  {
    id: 'riskClassificationEuAIA',
    text: 'Are your GenAI systems classified by EU AI Act risk categories (unacceptable, high, limited, minimal)?',
    options: ['Yes, all classified', 'Partially classified', 'Classification in progress', 'No'],
    info: 'Risk classification dictates obligation levels.',
    complianceAreaId: 'regulation',
    priority: 'high'
  },
  {
    id: 'highRiskObligationsGenAi',
    text: 'If GenAI systems are high-risk, are you prepared for EU AI Act obligations (e.g., QMS, technical documentation, conformity assessment)?',
    options: ['Yes, fully prepared', 'Partially prepared', 'Aware, not yet prepared', 'Not applicable / No high-risk systems'],
    info: 'High-risk AI systems face stringent requirements.',
    complianceAreaId: 'regulation',
    priority: 'high'
  },
  {
    id: 'gpAiModelObligations',
    text: 'If developing/using GPAI models, are you aware of specific EU AI Act obligations (e.g., transparency, technical documentation)?',
    options: ['Yes, fully aware and prepared', 'Aware, partially prepared', 'Unaware of specific obligations', 'Not applicable'],
    info: 'GPAI models, particularly systemic ones, have dedicated rules.',
    complianceAreaId: 'regulation',
    priority: 'high'
  },
  {
    id: 'conformityAssessmentEuAIA',
    text: 'For high-risk GenAI systems, is there a plan for conformity assessment before market placement or use?',
    options: ['Yes, plan in place', 'Planning in progress', 'No plan yet', 'Not applicable'],
    info: 'Conformity assessment shows EU AI Act compliance.',
    complianceAreaId: 'regulation',
    priority: 'medium'
  },

  // Impact Domain
  {
    id: 'fundamentalRightsImpactGenAi',
    text: 'Has a Fundamental Rights Impact Assessment (FRIA) been conducted for GenAI systems, particularly if high-risk?',
    options: ['Yes, FRIA conducted', 'FRIA in progress', 'Planned, not started', 'No / Not applicable'],
    info: 'The EU AI Act emphasises fundamental rights protection.',
    complianceAreaId: 'impact',
    priority: 'high'
  },
  {
    id: 'biasDetectionMitigationGenAi',
    text: 'Are processes in place to detect, document, and mitigate biases in GenAI models and their outputs?',
    options: ['Yes, robust processes', 'Processes in development', 'Aware, no formal process', 'No'],
    info: 'Addressing bias is vital for fairness and non-discrimination.',
    complianceAreaId: 'impact',
    priority: 'high'
  },
  {
    id: 'societalImpactGenAi',
    text: 'Have potential societal impacts (e.g., employment, public discourse, environment) of GenAI systems been assessed?',
    options: ['Yes, comprehensive assessment', 'Partial assessment', 'Aware, not formally assessed', 'No'],
    info: 'Consider broader societal impacts beyond direct user harm.',
    complianceAreaId: 'impact',
    priority: 'medium'
  },
  {
    id: 'misusePotentialGenAi',
    text: 'Has the potential for misuse or malicious use of GenAI systems (e.g., deepfakes, disinformation) been assessed and documented?',
    options: ['Yes, assessed & documented', 'Assessed, not documented', 'Partially assessed', 'No'],
    info: 'Understanding misuse potential is key for risk management.',
    complianceAreaId: 'impact',
    priority: 'high'
  },
  {
    id: 'environmentalImpactGenAi',
    text: 'Has the environmental impact (e.g., energy use for training/inference) of GenAI models been considered or assessed?',
    options: ['Yes, assessed & documented', 'Considered, not formally assessed', 'Aware, no action taken', 'No'],
    info: 'Sustainability is an increasing concern for large AI models.',
    complianceAreaId: 'impact',
    priority: 'low'
  },

  // Governance & Operations Domain
  {
    id: 'genAiPolicyFramework',
    text: 'Has your organization established a formal, documented policy framework specifically addressing the governance of GenAI development, deployment, and use, including acceptable use, data handling, and ethical considerations?',
    options: ['Yes, comprehensive & documented', 'Policy in development', 'Informal guidelines exist', 'No specific GenAI policy'],
    info: 'A clear GenAI policy framework is crucial for consistent, responsible, and compliant use across the organization.',
    complianceAreaId: 'governance',
    priority: 'high'
  },
  {
    id: 'genAiRolesAccountability',
    text: 'Are there clearly defined roles, responsibilities, and accountability structures for the oversight and governance of GenAI systems, including a designated individual or body responsible for GenAI compliance?',
    options: ['Yes, clearly defined & assigned', 'Partially defined or assigned', 'Responsibilities being defined', 'No defined roles/accountability'],
    info: 'Clear accountability ensures that GenAI governance is effectively managed and enforced.',
    complianceAreaId: 'governance',
    priority: 'high'
  },
  {
    id: 'genAiLegalReviewProcess',
    text: 'Is there a formal process to regularly review and ensure that GenAI systems and their use comply with applicable local laws, regulations (e.g., data privacy, IP, consumer protection), and contractual obligations?',
    options: ['Yes, formal & regular review process', 'Ad-hoc review process', 'Process being developed', 'No formal review process'],
    info: 'Ongoing legal and regulatory review is essential to maintain compliance in the evolving GenAI landscape.',
    complianceAreaId: 'governance',
    priority: 'high'
  },
  {
    id: 'genAiIncidentResponsePlan',
    text: 'Does your organization have an incident response plan specifically addressing potential breaches, misuse, or failures related to GenAI systems, including notification procedures and mitigation strategies?',
    options: ['Yes, specific GenAI plan in place', 'General IT incident plan adapted for AI', 'Plan in development', 'No specific AI incident plan'],
    info: 'GenAI incidents (e.g., data leakage via LLM, generation of harmful content) may require specialized response procedures beyond standard IT incidents.',
    complianceAreaId: 'governance',
    priority: 'medium'
  },
  {
    id: 'genAiQMS',
    text: 'Has a Quality Management System (QMS) or equivalent set of processes been established or adapted to oversee the lifecycle of GenAI models, including development, testing, validation, and monitoring for performance and compliance?',
    options: ['Yes, comprehensive QMS for GenAI', 'QMS partially adapted/implemented', 'QMS principles being considered', 'No specific QMS for GenAI'],
    info: 'A QMS helps ensure GenAI systems are developed and operate reliably, ethically, and in compliance with standards.',
    complianceAreaId: 'governance',
    priority: 'medium'
  },
  {
    id: 'genAiEmployeeTrainingGovernance',
    text: 'Are employees who develop, deploy, or use GenAI systems provided with regular training on relevant policies, ethical guidelines, legal obligations, and potential risks associated with GenAI?',
    options: ['Yes, regular & comprehensive training', 'Ad-hoc or initial training only', 'Training program in development', 'No formal training provided'],
    info: 'Educated employees are key to mitigating risks and ensuring responsible GenAI adoption.',
    complianceAreaId: 'governance',
    priority: 'medium'
  },

  // Data Domain
  {
    id: 'gdprComplianceGenAi',
    text: 'Do GenAI systems processing personal data comply with GDPR principles (e.g., lawfulness, fairness, transparency, data minimisation)?',
    options: ['Yes, fully compliant', 'Partially compliant', 'Compliance efforts ongoing', 'Not applicable / No personal data'],
    info: 'GDPR applies to AI systems processing EU residents\' personal data.',
    complianceAreaId: 'data',
    priority: 'high',
    regions: ['EU', 'UK'] // GDPR relevant regions
  },
  {
    id: 'dataProcessingAgreementsGenAi',
    text: 'Are Data Processing Agreements (DPAs) in place with third-party GenAI providers/users involving personal data?',
    options: ['Yes, for all relevant parties', 'For some parties', 'No DPAs in place', 'Not applicable'],
    info: 'DPAs are mandatory under GDPR for controller-processor relations.',
    complianceAreaId: 'data',
    priority: 'high'
  },
  {
    id: 'hipaaComplianceGenAi',
    text: 'For GenAI in healthcare, are they HIPAA compliant regarding Protected Health Information (PHI)?',
    options: ['Yes, fully compliant', 'Partially compliant', 'Compliance efforts ongoing', 'Not applicable'],
    info: 'HIPAA sets standards for protecting sensitive patient health information.',
    complianceAreaId: 'data',
    priority: 'high',
    regions: ['USA'] // HIPAA specific to USA
  },
  {
    id: 'syntheticDataGenAi',
    text: 'If using synthetic data for GenAI, has its quality, representativeness, and re-identification risks been assessed?',
    options: ['Yes, thoroughly assessed', 'Partially assessed', 'Aware of risks, not assessed', 'Not using synthetic data'],
    info: 'Synthetic data has its own privacy and quality challenges.',
    complianceAreaId: 'data',
    priority: 'medium'
  },
  {
    id: 'dataSubjectRightsGenAi',
    text: 'Are mechanisms in place for data subject rights (e.g., access, rectification, erasure) for personal data used/generated by GenAI systems?',
    options: ['Yes, robust mechanisms', 'Mechanisms in development', 'Limited/manual mechanisms', 'No / Not applicable'],
    info: 'GenAI systems must respect GDPR data subject rights.',
    complianceAreaId: 'data',
    priority: 'high'
  },

  // Security Domain
  {
    id: 'adversarialAttackDefenseGenAi',
    text: 'Are defences implemented against common adversarial attacks on GenAI models (e.g., data poisoning, model evasion, prompt injection)?',
    options: ['Yes, comprehensive defences', 'Some defences implemented', 'Aware, planning defences', 'No specific defences'],
    info: 'GenAI models are vulnerable to unique security threats.',
    complianceAreaId: 'security',
    priority: 'high'
  },
  {
    id: 'dataSecurityTrainingGenAi',
    text: 'Is data for training, fine-tuning, and inference of GenAI models secured against unauthorised access, leakage, or corruption?',
    options: ['Yes, strong security', 'Moderate security', 'Basic security', 'Security unclear/lacking'],
    info: 'Protecting data throughout the AI lifecycle is critical.',
    complianceAreaId: 'security',
    priority: 'high'
  },
  {
    id: 'modelSecurityGenAi',
    text: 'Are your GenAI models (weights, architecture) protected against theft or unauthorised modification?',
    options: ['Yes, strong protection', 'Moderate protection', 'Basic protection', 'Protection unclear/lacking'],
    info: 'AI models are valuable IP and security assets.',
    complianceAreaId: 'security',
    priority: 'medium'
  },
  {
    id: 'accessControlsGenAi',
    text: 'Are robust access controls and authentication for users and systems interacting with GenAI applications in place?',
    options: ['Yes, robust controls', 'Standard controls', 'Limited controls', 'No specific access controls'],
    info: 'Ensuring only authorised access to GenAI capabilities.',
    complianceAreaId: 'security',
    priority: 'high'
  },
  {
    id: 'incidentResponseGenAi',
    text: 'Is there an incident response plan specifically addressing security breaches or failures related to GenAI systems?',
    options: ['Yes, specific plan', 'General IT incident plan covers AI', 'No specific AI incident plan', 'No incident plan'],
    info: 'GenAI incidents may require specialised response procedures.',
    complianceAreaId: 'security',
    priority: 'medium'
  },

  // Ethics Domain
  {
    id: 'ethicalGuidelinesGenAi',
    text: 'Have ethical guidelines for GenAI development and deployment been established or adopted?',
    options: ['Yes, comprehensive guidelines', 'Guidelines in development', 'Considering guidelines', 'No formal guidelines'],
    info: 'Ethical principles guide responsible AI beyond legal compliance.',
    complianceAreaId: 'ethics',
    priority: 'high'
  },
  {
    id: 'fairnessMetricsGenAi',
    text: 'Are GenAI systems monitored for fairness using defined metrics, with identified disparities addressed?',
    options: ['Yes, continuous monitoring & mitigation', 'Periodic monitoring', 'Aware, no active monitoring', 'No'],
    info: 'Fairness requires ongoing effort and measurement.',
    complianceAreaId: 'ethics',
    priority: 'high'
  },
  {
    id: 'humanOversightEthicsGenAi',
    text: 'Is there a clear process for human oversight and intervention in GenAI decisions/content, especially in sensitive contexts?',
    options: ['Yes, well-defined process', 'Process exists, ad-hoc', 'Limited human oversight', 'No structured human oversight'],
    info: 'EU AI Act mandates human oversight for high-risk systems.',
    complianceAreaId: 'ethics',
    priority: 'high'
  },
  {
    id: 'stakeholderEngagementEthicsGenAi',
    text: 'Do you engage diverse stakeholders (including affected communities) on ethical implications of GenAI systems?',
    options: ['Yes, regular engagement', 'Occasional engagement', 'Limited/no engagement', 'Not applicable'],
    info: 'Involving stakeholders can uncover unforeseen ethical issues.',
    complianceAreaId: 'ethics',
    priority: 'medium'
  },
  {
    id: 'accountabilityMechanismsEthicsGenAi',
    text: 'Are clear accountability mechanisms in place for outcomes and decisions by or assisted by GenAI systems?',
    options: ['Yes, clear mechanisms', 'Mechanisms developing', 'Limited accountability', 'No'],
    info: 'Knowing who is responsible when AI systems err is vital.',
    complianceAreaId: 'ethics',
    priority: 'high'
  },

  // Capability Domain
  {
    id: 'transparencyGenAiOutput',
    text: 'Is it clearly disclosed to users when they interact with GenAI systems or consume AI-generated content (e.g., deepfakes, text)?',
    options: ['Yes, always disclosed', 'Disclosed most cases', 'Partially/inconsistently disclosed', 'No disclosure'],
    info: 'Transparency is a key EU AI Act requirement for certain AI systems.',
    complianceAreaId: 'capability',
    priority: 'high'
  },
  {
    id: 'explainabilityGenAi',
    text: 'Can GenAI systems provide context-appropriate explanations or justifications for their outputs/decisions?',
    options: ['Yes, satisfactory degree', 'Limited explainability', 'Explainability research goal', 'No explainability features'],
    info: 'Though challenging for GenAI, some explainability is often desired/required.',
    complianceAreaId: 'capability',
    priority: 'medium'
  },
  {
    id: 'userControlGenAi',
    text: 'Do users have appropriate control over GenAI system operation and outputs (e.g., stop, correct, override)?',
    options: ['Yes, sufficient control', 'Some control', 'Limited control', 'No direct control'],
    info: 'Empowering users with control enhances trust and safety.',
    complianceAreaId: 'capability',
    priority: 'medium'
  },
  {
    id: 'robustnessReliabilityGenAi',
    text: 'Are GenAI systems tested for robustness and reliability under various conditions (including edge cases, unexpected inputs)?',
    options: ['Yes, extensively tested', 'Moderately tested', 'Basic testing', 'Limited/no specific testing'],
    info: 'High-risk AI systems must be robust and reliable.',
    complianceAreaId: 'capability',
    priority: 'high'
  },
  {
    id: 'technicalDocumentationGenAi',
    text: 'Is comprehensive technical documentation maintained for your GenAI systems, as required by the EU AI Act for high-risk systems?',
    options: ['Yes, up-to-date and comprehensive', 'Documentation in progress', 'Basic documentation exists', 'No formal technical documentation'],
    info: 'Technical documentation is essential for conformity assessment and transparency.',
    complianceAreaId: 'capability',
    priority: 'high'
  }
  // Add more questions for all compliance areas here...
];

const complianceAreas: ComplianceArea[] = [
  {
    id: 'discovery',
    name: 'Discovery & Inventory',
    icon: <Database size={20} />,
    description: 'Understanding your GenAI landscape, data sources, and model purposes.',
    color: '#f7b96e' // Light Orange/Amber
  },
  {
    id: 'regulation',
    name: 'Regulation & Classification',
    icon: <Scale size={20} />,
    description: 'Navigating EU AI Act applicability, risk classification, and obligations.',
    color: '#7192bf' // Muted Blue
  },
  {
    id: 'impact',
    name: 'Impact Assessment & Mitigation',
    icon: <BarChart3 size={20} />,
    description: 'Assessing fundamental rights impact, bias, and societal effects.',
    color: '#2a4eb4' // Darker Blue
  },
  {
    id: 'governance',
    name: 'Governance & Operations',
    icon: <Gavel size={20} />,
    description: 'Establishing policies, roles, QMS, and incident response for GenAI.',
    color: '#b07da1' // Muted Purple/Magenta
  },
  {
    id: 'data', 
    name: 'Data', 
    icon: <Database size={20} />, 
    description: 'Data governance, privacy and security',
    color: '#b07da1'
  },
  {
    id: 'security', 
    name: 'Security', 
    icon: <Server size={20} />, 
    description: 'Cybersecurity and model robustness',
    color: '#f7b96e'
  },
  {
    id: 'ethics', 
    name: 'Ethics', 
    icon: <Scale size={20} />, 
    description: 'Ethical considerations and human oversight',
    color: '#7192bf'
  },
  {
    id: 'capability', 
    name: 'Capability & Readiness', 
    icon: <Brain size={20} />, 
    description: 'Organisational readiness, skills, and technical documentation.',
    color: '#2a4eb4' // Using a color from the palette
  }
];

const regionOptions = [
  { id: 'USA', name: 'United States' },
  { id: 'EU', name: 'European Union' },
  { id: 'UK', name: 'United Kingdom' },
  { id: 'Global', name: 'Other / Global (Show all questions)' },
];

function App() {
  const [currentComplianceAreaId, setCurrentComplianceAreaId] = useState<string>(complianceAreas[0]?.id || '');
  const [calculatedOverallPercentage, setCalculatedOverallPercentage] = useState(0);
  const [generatedComplianceAreaInsights, setGeneratedComplianceAreaInsights] = useState<ComplianceAreaInsight[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedRecommendations, setGeneratedRecommendations] = useState<Recommendation[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const toggleInfo = (questionId: string) => {
    setExpandedInfo(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const filteredQuestions = useMemo(() => {
    if (selectedRegion === 'Global') {
      return questions; // All questions if 'Global' is selected
    }
    // For null (no region selected) or a specific region
    return questions.filter(q => {
      const questionIsGlobalOrNoRegion = !q.regions || q.regions.length === 0;
      if (!selectedRegion) { // Nothing selected by user yet
        return questionIsGlobalOrNoRegion; // Show only universally applicable questions (no specific region tag)
      }
      // A specific region is selected (e.g., 'EU')
      // Show if question is global/no-region OR if it matches the selected region
      return questionIsGlobalOrNoRegion || (q.regions && q.regions.includes(selectedRegion));
    });
  }, [selectedRegion]);

  // ... rest of the code ...

  const handleDownloadReport = () => {
    const doc = new jsPDF();

    // --- Color Definitions for PDF ---
    const PDF_TEXT_COLOR_MAP: { [key: string]: [number, number, number] } = {
      black: [0, 0, 0],
      white: [255, 255, 255],
      emerald: [74, 222, 128], // #4ade80
      gray: [100, 100, 100]
    };

    const PDF_BG_COLOR_MAP: { [key: string]: string } = {
      red: '#ef4444',        // red-500
      amber: '#f59e0b',      // amber-500
      yellow: '#eab308',     // yellow-500
      sky: '#38bdf8',        // sky-400 (example, update if using)
      green: '#22c55e',      // green-500
      emerald: '#10b981',    // emerald-500 (Restored)
      gray300: '#D1D5DB',    // gray-300 (Tailwind hex)
      gray600: '#4b5563',    // gray-600
      gray700: '#374151',    // gray-700
    };

    const getTextColorForBackground = (bgColorName: string): [number, number, number] => {
      // Simple logic: dark backgrounds get white text, light backgrounds get black text
      // Add more sophisticated logic if needed based on specific colors
      if (['red', 'amber', 'sky', 'green', 'gray600'].includes(bgColorName)) {
        return PDF_TEXT_COLOR_MAP.white;
      }
      return PDF_TEXT_COLOR_MAP.black;
    };

    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 10;
    const margin = 20;
    const maxWidth = doc.internal.pageSize.width - (margin * 2);

    // ... rest of the code ...

    complianceAreas.forEach(area => {
      if (yPos > pageHeight - (margin * 2)) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setTextColor(39, 174, 96);
      doc.text(area.name, margin, yPos);
      yPos += lineHeight * 1.5;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const areaQuestionsForReport = filteredQuestions.filter(q => q.complianceAreaId === area.id);
      areaQuestionsForReport.forEach(question => {
        // const answer = answers[question.id] || 'Not answered'; // This logic is now part of fullText
        // Ensure question.text is defined before using it, to prevent error with PDF generation
        // const questionText = question.text || 'Question text not available'; // This logic is now part of questionTextContent
        if (yPos > pageHeight - (margin * 2)) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFont(doc.getFont().fontName, 'bold');
        const bulletPoint = '•';
        doc.text(bulletPoint, margin, yPos);
        const questionTextContent = question.text || 'N/A';
        const answerTextContent = answers[question.id] || 'Not Answered';
        const fullText = `${questionTextContent}: ${answerTextContent}`;
        const textLines = doc.splitTextToSize(fullText, maxWidth - 10); // -10 for bullet and spacing
        doc.text(textLines, 25, yPos);
        yPos += lineHeight * textLines.length;

        // The answer is now part of the textLines rendering above, this block is redundant.
        // if (answer) { 
        //   doc.setFont(doc.getFont().fontName, 'normal');
        //   doc.text(`Response: ${answer}`, margin + 5, yPos);
        //   yPos += lineHeight;
        // }

        // if (question.documentationRequired) { // Commented out
        //   const docStatus = documentation[question.id]  // Commented out
        //     ? '✓ Documentation Available' // Commented out
        //     : '⚠ Documentation Required'; // Commented out
        //   doc.setTextColor(documentation[question.id] ? 39 : 174, documentation[question.id] ? 174 : 39, documentation[question.id] ? 96 : 39); // Commented out
        //   doc.text(docStatus, margin + 5, yPos); // Commented out
        //   doc.setTextColor(0, 0, 0); // Commented out
        //   yPos += lineHeight; // Commented out
        // } // Commented out

        yPos += lineHeight / 2;
      });
      yPos += lineHeight;
  });

  // --- ASSESSMENT SUMMARY SECTION ---
  if (yPos > pageHeight - (margin * 4)) { // Check if enough space for section title, or add new page
    doc.addPage();
    yPos = margin;
  }
  doc.setFontSize(18);
  doc.setTextColor(39, 174, 96);
  doc.text('Assessment Summary', margin, yPos);
  yPos += lineHeight * 1.5;

  // Helper function for adding wrapped text
  const addWrappedText = (text: string, currentY: number, options: { fontSize?: number, isBold?: boolean, color?: string, indent?: number } = {}) => {
    if (currentY > pageHeight - (margin * 2)) {
      doc.addPage();
      currentY = margin;
    }
    doc.setFontSize(options.fontSize || 12);
    doc.setFont(doc.getFont().fontName, options.isBold ? 'bold' : 'normal');
    if (options.color && PDF_TEXT_COLOR_MAP[options.color]) {
      doc.setTextColor(...PDF_TEXT_COLOR_MAP[options.color]);
    } else if (options.color === 'primary') { // Legacy handling for 'primary', assuming it maps to emerald
      doc.setTextColor(...PDF_TEXT_COLOR_MAP.emerald);
    } else {
      doc.setTextColor(...PDF_TEXT_COLOR_MAP.black);
    }
    
    const indent = options.indent || 0;
    const textLines = doc.splitTextToSize(text, maxWidth - indent);
    doc.text(textLines, margin + indent, currentY);
    return currentY + (lineHeight * textLines.length) + (lineHeight / 2);
  };

  // Overall AI Security Maturity
  if (yPos > pageHeight - (margin * 6)) { doc.addPage(); yPos = margin; } // Increased space check for this section
  doc.setFontSize(16);
  doc.setTextColor(...PDF_TEXT_COLOR_MAP.black);
  doc.setFont(doc.getFont().fontName, 'bold');
  doc.text('Overall AI Security Maturity', margin, yPos);
  yPos += lineHeight * 0.75; // Reduced space after title
  doc.setFont(doc.getFont().fontName, 'normal');

  const currentMaturityPdf = getMaturityDataForPdf(calculatedOverallPercentage);
  
  // Maturity Badge
  yPos += lineHeight * 0.75;
  const badgeWidth = doc.getTextWidth(currentMaturityPdf.name) + 10; // Dynamic width based on text
  const badgeHeight = lineHeight * 0.8;
  const badgeX = margin;
  const badgeY = yPos;
  doc.setFillColor(PDF_BG_COLOR_MAP[currentMaturityPdf.colorName as keyof typeof PDF_BG_COLOR_MAP] || PDF_BG_COLOR_MAP.gray600);
  doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...getTextColorForBackground(currentMaturityPdf.colorName));
  doc.text(currentMaturityPdf.name, badgeX + 5, badgeY + badgeHeight * 0.75);
  yPos += badgeHeight + lineHeight * 0.5;

  // Maturity Description
  doc.setTextColor(...PDF_TEXT_COLOR_MAP.black);
  yPos = addWrappedText(currentMaturityPdf.description, yPos, { fontSize: 10 });
  yPos += lineHeight * 0.5;

  // Multi-Segment Progress Bar
  const progressBarY = yPos;
  const progressBarHeight = lineHeight * 0.75;
  const totalSegments = MATURITY_LEVELS.length;
  const segmentWidth = (maxWidth - (totalSegments -1) * 1) / totalSegments; // Small gap between segments
  let currentX = margin;

  MATURITY_LEVELS.forEach((level, index) => {
    const segmentColor = index <= MATURITY_LEVELS.findIndex(l => l.name === currentMaturityPdf.name) 
      ? PDF_BG_COLOR_MAP[level.colorName as keyof typeof PDF_BG_COLOR_MAP] 
      : PDF_BG_COLOR_MAP.gray600;
    doc.setFillColor(segmentColor || PDF_BG_COLOR_MAP.gray600);
    doc.rect(currentX, progressBarY, segmentWidth, progressBarHeight, 'F');
    currentX += segmentWidth + 1; // +1 for gap
  });
  yPos += progressBarHeight + lineHeight * 0.25;

  // Overall Percentage Text
  doc.setFontSize(9);
  doc.setTextColor(...PDF_TEXT_COLOR_MAP.emerald);
  const percentageText = `${calculatedOverallPercentage.toFixed(0)}% Complete`;
  const percentageTextWidth = doc.getTextWidth(percentageText);
  doc.text(percentageText, maxWidth + margin - percentageTextWidth, yPos);
  yPos += lineHeight * 1.5; // Increased space after this section

  // Key Domain Insights
  if (yPos > pageHeight - (margin * 3)) { doc.addPage(); yPos = margin; }
  doc.setFontSize(16);
  doc.setFont(doc.getFont().fontName, 'bold');
  doc.text('Key Domain Insights', margin, yPos);
  yPos += lineHeight * 1.5;
  doc.setFont(doc.getFont().fontName, 'normal');
  
  if (generatedComplianceAreaInsights.length > 0) {
    generatedComplianceAreaInsights.forEach(insight => {
      if (yPos > pageHeight - margin) { doc.addPage(); yPos = margin; }
      const insightTag = getDomainInsightTagForPdf(insight.progress);
      yPos = addWrappedText(`• ${insight.name}: ${insight.progress.toFixed(0)}% - ${insightTag}`, yPos);
    });
  } else {
    yPos = addWrappedText('No specific domain insights to display at this time.', yPos, { fontSize: 10 });
  }
  yPos += lineHeight;

  // Key Domain Insights rendering (names and progress bars)
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
  };

  if (generatedComplianceAreaInsights && generatedComplianceAreaInsights.length > 0) {
    generatedComplianceAreaInsights.forEach(insight => {
      if (yPos > pageHeight - (margin * 3)) { // Check for page break, leave more space for content
        doc.addPage();
        yPos = margin;
        // Re-add section title if it's a new page and this is the first item
        doc.setFontSize(16);
        doc.setFont(doc.getFont().fontName, 'bold');
        doc.text('Key Domain Insights', margin, yPos);
        yPos += lineHeight * 1.5;
        doc.setFont(doc.getFont().fontName, 'normal');
      }

      doc.setFontSize(12);
      doc.setTextColor(...PDF_TEXT_COLOR_MAP.black);
      doc.text(insight.name, margin, yPos);
      yPos += lineHeight * 0.8;

      const progressBarWidth = maxWidth * 0.75; // Adjusted width to be more prominent
      const progressBarHeightPdf = lineHeight * 0.6;
      const filledWidth = progressBarWidth * (insight.progress / 100);
      const insightColorRgb = hexToRgb(insight.color);

      // Draw background of progress bar
      doc.setFillColor(PDF_BG_COLOR_MAP.gray300); // Use hex string directly
      doc.rect(margin, yPos, progressBarWidth, progressBarHeightPdf, 'F');

      // Draw filled part of progress bar
      if (insightColorRgb) {
        doc.setFillColor(...insightColorRgb); // Spread RGB array
      } else {
        doc.setFillColor(PDF_BG_COLOR_MAP.emerald); // Use hex string directly for default
      }
      doc.rect(margin, yPos, filledWidth, progressBarHeightPdf, 'F');

      // Optional: Add percentage text next to or on the bar
      doc.setFontSize(8);
      doc.setTextColor(...PDF_TEXT_COLOR_MAP.black);
      const progressText = `${insight.progress.toFixed(0)}%`;
      // const textWidth = doc.getTextWidth(progressText);
      // Adjust text position as needed, e.g., to the right of the bar or centered on it
      doc.text(progressText, margin + progressBarWidth + 5, yPos + progressBarHeightPdf * 0.75 ); 

      yPos += progressBarHeightPdf + lineHeight; // Space after each insight
    });
  }
  yPos += lineHeight * 0.5; // Extra space before next section

  // Key Recommendations
  if (yPos > pageHeight - (margin * 3)) { doc.addPage(); yPos = margin; }
  doc.setFontSize(16);
  doc.setFont(doc.getFont().fontName, 'bold');
  doc.text('Key Recommendations', margin, yPos);
  yPos += lineHeight * 1.5;

  if (generatedRecommendations.length > 0) {
    generatedRecommendations.forEach(rec => {
      if (yPos > pageHeight - (margin * 3)) { doc.addPage(); yPos = margin; } // Check for title + some description lines
      yPos = addWrappedText(rec.title, yPos, { isBold: true });
      yPos = addWrappedText(rec.description, yPos, { fontSize: 10, indent: 5 });
      yPos += lineHeight / 2; // Extra space between recommendations
    });
  } else {
    yPos = addWrappedText('No specific recommendations triggered based on your assessment.', yPos, { fontSize: 10 });
  }
  yPos += lineHeight;
  // --- END OF ASSESSMENT SUMMARY SECTION ---

  doc.addPage();
    yPos = margin;
    doc.setFontSize(18);
    doc.setTextColor(39, 174, 96);
    doc.text('Next Steps', margin, yPos);
    yPos += lineHeight * 1.5;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const nextSteps = [
      'Schedule a comprehensive review of your AI systems',
      'Develop a compliance roadmap based on this assessment',
      'Establish documentation procedures for high-priority areas',
      'Review and update risk management processes',
      'Consider expert consultation for complex compliance requirements'
    ];

    nextSteps.forEach(step => {
      if (yPos > pageHeight - (margin * 2)) {
        doc.addPage();
        yPos = margin;
      }
      const stepText = doc.splitTextToSize(`• ${step}`, maxWidth);
      doc.text(stepText, margin, yPos);
      yPos += lineHeight * stepText.length + lineHeight/2;
    });

    yPos += lineHeight * 2;
    doc.setFontSize(14);
    doc.setTextColor(39, 174, 96);
    doc.text('Book a Consultation', margin, yPos);
    yPos += lineHeight * 1.5;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const consultText = 'For personalised guidance on implementing these recommendations and ensuring full compliance with the EU AI Act, book a consultation with our experts at:';
    const consultUrl = 'https://www.devsecai.io/contact-us';
    
    const splitConsultText = doc.splitTextToSize(consultText, maxWidth);
    splitConsultText.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    
    doc.setTextColor(39, 174, 96);
    doc.text(consultUrl, margin, yPos);

    doc.save('ai-compliance-assessment.pdf');
  };

  const handleDownloadAndCloseModal = () => {
    handleDownloadReport();
    setShowEmailModal(false);
  };


const handleRegionSelect = (regionId: string) => {
  setSelectedRegion(regionId);
  setCurrentComplianceAreaId(complianceAreas[0]?.id || 'discovery');
  setAnswers({});
  setShowResultsScreen(false);
  window.scrollTo(0, 0);
};

const handleResetAssessment = () => {
  setSelectedRegion(null);
  setCurrentComplianceAreaId(complianceAreas[0]?.id || '');
  setAnswers({});
  setShowResultsScreen(false);
  setIsGeneratingReport(false); // Reset loading state
  // setEmail(''); // Optionally reset email
  window.scrollTo(0, 0);
};

// Helper functions that depend on state (answers, filteredQuestions, etc.)
const calculateComplianceAreaProgress = (complianceAreaId: string): number => {
  const areaQuestions = filteredQuestions.filter(q => q.complianceAreaId === complianceAreaId);
  if (areaQuestions.length === 0) return 0; // No questions in this area means 0% progress for this area.

  let totalScoreForArea = 0;
  const maxScorePerQuestion = 100;

  areaQuestions.forEach(question => {
    const selectedAnswer = answers[question.id];
    if (selectedAnswer) {
      const numOptions = question.options.length;
      if (numOptions === 0) return; // Should not happen, but guard

      const selectedIndex = question.options.indexOf(selectedAnswer);

      if (selectedIndex !== -1) { // Answer is valid and found in options
        if (numOptions === 1) {
          // If there's only one option, selecting it means 100% for this question
          totalScoreForArea += maxScorePerQuestion;
        } else {
          // Multiple options: score is higher for earlier options (closer to index 0)
          const questionScore = ((numOptions - 1 - selectedIndex) / (numOptions - 1)) * maxScorePerQuestion;
          totalScoreForArea += questionScore;
        }
      }
    }
    // Unanswered questions contribute 0 to totalScoreForArea
  });

  const maxPossibleScoreForArea = areaQuestions.length * maxScorePerQuestion;
  // If maxPossibleScoreForArea is 0 (e.g. areaQuestions was empty, though guarded above), result is 0.
  if (maxPossibleScoreForArea === 0) return 0; 

  return Math.round((totalScoreForArea / maxPossibleScoreForArea) * 100);
};

const calculateOverallProgress = (): string => {
  const answeredInFiltered = Object.keys(answers).filter(qId => filteredQuestions.some(fq => fq.id === qId)).length;
  if (filteredQuestions.length === 0 && questions.length > 0 && !selectedRegion) return "Select a region to begin.";
  if (filteredQuestions.length === 0) return "0 of 0 questions answered"; 
  return `${answeredInFiltered} of ${filteredQuestions.length} questions answered`;
};
  
const calculatePercentageComplete = (): number => {
  if (filteredQuestions.length === 0) return 0;

  let totalOverallScore = 0;
  const maxScorePerQuestion = 100;

  filteredQuestions.forEach(question => {
    const selectedAnswer = answers[question.id];
    if (selectedAnswer) {
      const numOptions = question.options.length;
      if (numOptions === 0) return; // Skip if no options, should not occur

      const selectedIndex = question.options.indexOf(selectedAnswer);

      if (selectedIndex !== -1) { // Answer is valid
        if (numOptions === 1) {
          totalOverallScore += maxScorePerQuestion;
        } else {
          const questionScore = ((numOptions - 1 - selectedIndex) / (numOptions - 1)) * maxScorePerQuestion;
          totalOverallScore += questionScore;
        }
      }
    }
    // Unanswered questions contribute 0
  });

  const maxPossibleOverallScore = filteredQuestions.length * maxScorePerQuestion;
  // If maxPossibleOverallScore is 0 (e.g. filteredQuestions was empty, though guarded above), result is 0.
  if (maxPossibleOverallScore === 0) return 0;

  return Math.round((totalOverallScore / maxPossibleOverallScore) * 100);
};

const getCurrentComplianceAreaQuestions = () => {
  return filteredQuestions.filter(q => q.complianceAreaId === currentComplianceAreaId);
};

const areCurrentComplianceAreaQuestionsAnswered = () => {
  const currentQuestions = getCurrentComplianceAreaQuestions();
  if (currentQuestions.length === 0) return true;
  return currentQuestions.every(q => answers[q.id] && answers[q.id] !== '');
};

const handleNextComplianceArea = () => {
  const currentIndex = complianceAreas.findIndex(area => area.id === currentComplianceAreaId);
  const nextIndex = (currentIndex + 1);
  if (nextIndex < complianceAreas.length) {
      setCurrentComplianceAreaId(complianceAreas[nextIndex]?.id);
  } // If it's the last area, the "Finish & View Results" button logic handles it.
  window.scrollTo(0, 0);
};

const isAssessmentComplete = () => {
    if (filteredQuestions.length === 0 && questions.length > 0 && !selectedRegion) return false;
    if (filteredQuestions.length === 0 && questions.length === 0) return true; // Handles case where there are no questions at all
    const answeredInFiltered = Object.keys(answers).filter(qId => filteredQuestions.some(fq => fq.id === qId)).length;
    return answeredInFiltered === filteredQuestions.length;
  };

  return (
    <>
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202938] p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-100 mb-6">Please provide your details to download</h3>
            
            <div className="mb-4">
              <label htmlFor="modalEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input 
                id="modalEmail" 
                type="email" 
                placeholder="Work email preferred" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#1F2937] border border-gray-600 rounded-md text-gray-100 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="modalCompanyName" className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
              <input 
                id="modalCompanyName" 
                type="text" 
                placeholder="Optional" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 bg-[#1F2937] border border-gray-600 rounded-md text-gray-100 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowEmailModal(false)} 
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownloadAndCloseModal} 
                disabled={!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)}
                className="px-6 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>
            {!email && <p className='text-xs text-yellow-400 mt-3 text-center'>Please enter an email address.</p>}
            {email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email) && <p className='text-xs text-yellow-400 mt-3 text-center'>Please enter a valid email address.</p>}
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#121828] text-gray-100">
      <div className="max-w-[800px] mx-auto p-6 pb-24">
        {/* Common Header Section (Logo and Title) */}
        <div className="text-center mb-8">
          <img src="/Logo-Transparent.png" alt="DevSecAI" className="h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-semibold mb-5">GenAI Privacy and Compliance Assessment</h1>
        </div> {/* End of Common Header Section */}

        {/* Main Conditional Content Area */}
        {!selectedRegion ? (
          // TRUE block: No region selected - Show Region Selection UI
          <div className="bg-[#202938] rounded-lg p-8 my-8 text-center">
            <h2 className="text-xl font-semibold text-emerald-400 mb-6">Select Your Primary Region of Operation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {regionOptions.map(region => (
                <button
                  key={region.id}
                  onClick={() => handleRegionSelect(region.id)}
                  className="w-full p-4 bg-[#1F2937] border border-gray-600 rounded-md text-gray-100 hover:bg-emerald-500 hover:border-emerald-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div> // End of Region Selection UI
        ) : (
          // FALSE block: Region IS selected - Show Compliance Area Tabs, Progress, and then Questionnaire/Results
          <>
            {/* Compliance Area Tabs and Overall Progress Section */}
            <div className="mb-8"> {/* Wrapper for this section */}
              {/* Compliance Area Tabs */}
              <div className="grid grid-cols-4 gap-3 mb-8 bg-[#202938] p-4 rounded-lg">
                 {complianceAreas.map(area => {
                  const isActive = currentComplianceAreaId === area.id;
                  return (
                    <button
                      key={area.id}
                      onClick={() => setCurrentComplianceAreaId(area.id)}
                      className={`group flex flex-col items-center p-3 rounded-lg transition-colors focus:outline-none ${
                        isActive ? '' : 'hover:bg-[#2a2d36]'
                      }`}
                      style={{
                        borderColor: isActive ? area.color : 'transparent',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: isActive ? `0 0 8px ${area.color}30` : 'none' // Subtle glow for active
                      }}
                    >
                      <div 
                        className={`mb-1 transition-colors ${isActive ? '' : 'group-hover:text-[var(--area-color)]'}`}
                        style={{
                          color: isActive ? area.color : '#D1D5DB', // Initial color for inactive icon
                          '--area-color': area.color // CSS variable for hover state
                        } as React.CSSProperties}
                      >
                        {area.icon}
                      </div>
                      <span 
                        className={`text-sm font-medium text-center transition-colors ${isActive ? '' : 'group-hover:text-[var(--area-color)]'}`}
                        style={{
                          color: isActive ? area.color : '#D1D5DB', // Initial color for inactive text
                          '--area-color': area.color, // CSS variable for hover state
                          lineHeight: '1.2'
                        } as React.CSSProperties}
                      >
                        {area.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Overall Progress Bar */}
              <div className="relative mt-4 mb-8">
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-emerald-400 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${calculatePercentageComplete()}%` }}
                  />
                </div>
                <div className="absolute right-0 -bottom-4 text-xs text-gray-400 mt-1">{calculatePercentageComplete()}% Complete</div>
              </div>
            </div> {/* End of Compliance Area Tabs and Overall Progress Section */}

            {/* Conditional Rendering for Results Screen or Questionnaire */}
            {showResultsScreen ? (
              (() => { 
                // Recalculate these here as they depend on the latest state right before rendering ResultsScreen
                const overallCompletionPercentageCalcd = calculatePercentageComplete(); 
                const complianceAreaInsightsDataCalcd = complianceAreas.map(area => ({
                  id: area.id,
                  name: area.name,
                  progress: calculateComplianceAreaProgress(area.id),
                  icon: area.icon,
                  color: area.color // Added color prop for insights
                }));

                return (
                  <ResultsScreen 
                    setShowEmailModal={setShowEmailModal}
                    handleResetAssessment={handleResetAssessment} 
                    overallCompletionPercentage={overallCompletionPercentageCalcd}
                    complianceAreaInsightsData={complianceAreaInsightsDataCalcd}
                    recommendations={generatedRecommendations}
                  />
                );
              })()
            ) : (
              // Questionnaire UI
              <div className="bg-[#202938] rounded-lg p-8">
                <div className="flex items-start gap-4 mb-8">
                  {complianceAreas.find(area => area.id === currentComplianceAreaId)?.icon}
                  <div>
                    <h2 className="text-3xl font-semibold text-emerald-400 mb-1">
                      {complianceAreas.find(area => area.id === currentComplianceAreaId)?.name}
                    </h2>
                    <p className="text-gray-300 mb-8">
                      {complianceAreas.find(area => area.id === currentComplianceAreaId)?.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-gray-400 mb-2">
                    {getCurrentComplianceAreaQuestions().length} Questions in {complianceAreas.find(area => area.id === currentComplianceAreaId)?.name}
                  </div>
                </div>

                <div className="space-y-8">
                  {getCurrentComplianceAreaQuestions().map((question) => (
                    <div key={question.id} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-gray-100 text-base font-semibold">{question.text}</h3>
                        {question.info && (
                          <button 
                            onClick={() => toggleInfo(question.id)} 
                            className="ml-2 p-1 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
                            aria-label="Toggle additional information"
                          >
                            {expandedInfo[question.id] ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                          </button>
                        )}
                      </div>
                      <div> {/* This div wraps the select and the expanded info */}
                        <div className="relative">
                          <select
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                            className="w-full p-3 pr-10 bg-[#1F2937] border border-gray-600 rounded-md text-gray-100 appearance-none cursor-pointer focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                          >
                            <option value="">Select your answer...</option>
                            {question.options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {expandedInfo[question.id] && (
                          <div className="mt-4 p-3 bg-[#1F2937] border border-gray-700 rounded-md shadow-sm">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap mb-2">{question.info}</p>
                            {question.article && (
                              <a 
                                href={question.article.startsWith('http') ? question.article : `https://${question.article}`}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-emerald-400 hover:text-emerald-300 underline flex items-center"
                              >
                                Read more <FileText size={14} className="inline ml-1" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Compliance Area / Analyse Results Button */}
                <div className="mt-10 flex justify-end">
                  {isAssessmentComplete() ? (
                    <button
                      onClick={() => {
                      setIsGeneratingReport(true);

                      // Generate Recommendations
                      const triggeredRecs: Recommendation[] = [];
                      questions.forEach(q => {
                        const answer = answers[q.id];
                        // New trigger logic: specific values OR fallback to last option
                        let triggerRecommendation = false;
                        if (q.triggerOptionValues && q.triggerOptionValues.includes(answer)) {
                          triggerRecommendation = true;
                        } else if (!q.triggerOptionValues && q.recommendationTriggerId && answer === q.options[q.options.length - 1]) {
                          // Fallback to last option if triggerOptionValues is not defined
                          triggerRecommendation = true;
                        }

                        if (q.recommendationTriggerId && triggerRecommendation) {
                          const rec = allPossibleRecommendations.find(r => r.id === q.recommendationTriggerId);
                          if (rec && !triggeredRecs.some(tr => tr.id === rec.id)) { // Add if found and not already added
                            triggeredRecs.push(rec);
                          }
                        }
                      });

                      // Sort by priority (high > medium > low) then take top 3
                      triggeredRecs.sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      });
                      setGeneratedRecommendations(triggeredRecs.slice(0, 3));

                      // Calculate and set overall percentage for PDF report
                      const overallPercentage = calculatePercentageComplete();
                      setCalculatedOverallPercentage(overallPercentage);

                      // Calculate and set compliance area insights for PDF report
                      const insightsData = complianceAreas.map(area => ({
                        id: area.id,
                        name: area.name,
                        progress: calculateComplianceAreaProgress(area.id),
                        icon: area.icon,
                        color: area.color
                      }));
                      setGeneratedComplianceAreaInsights(insightsData);

                      setTimeout(() => {
                        setShowResultsScreen(true);
                        setIsGeneratingReport(false);
                        window.scrollTo(0, 0); // Scroll to top when results are shown
                      }, 1500); // 1.5 seconds delay
                    }}
                      className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      Finish & View Results
                    </button>
                  ) : (
                    <button
                      onClick={handleNextComplianceArea}
                      disabled={!areCurrentComplianceAreaQuestionsAnswered()}
                      className={`px-6 py-3 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#202938] focus:ring-emerald-300 ${
                        areCurrentComplianceAreaQuestionsAnswered() 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next Compliance Area
                    </button>
                  )}
                </div>
              </div> // End Questionnaire UI
            )}
          </>
        )}
      </div> {/* End max-w-4xl */}

      {/* Loading Popup */}
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
          {/* <Loader2 className="h-12 w-12 text-emerald-400 animate-spin mb-4" /> */}
          <p className="text-white text-xl">Analyzing Results...</p>
        </div>
      )}

      {/* Fixed Footer - This should only be visible if a region is selected AND results are NOT shown */}
      {selectedRegion && !showResultsScreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Compliance Area Progress</div>
                  <div className="w-48 bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: complianceAreas.find(ca => ca.id === currentComplianceAreaId)?.color || '#34d399', // Default to emerald if color not found
                        width: `${calculateComplianceAreaProgress(currentComplianceAreaId)}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Questions Answered</div>
                  <div className="text-lg font-semibold">{calculateOverallProgress()}</div>
                </div>
              </div>
              {/* Removed email input and download from footer as they are on ResultsScreen now */}
            </div>
          </div>
        </div>
      )}
    </div> {/* End min-h-screen */}
    </> // Closing fragment for modal and main content
  ); // Closing parenthesis for App's return statement
} // Closing brace for App function

export default App;