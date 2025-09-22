import SimplifiedPostcardEditor from './components/PostcardEditor/SimplifiedPostcardEditor'
import TestEditor from './components/PostcardEditor/TestEditor'
import SimplifiedEditorTest from './components/PostcardEditor/SimplifiedEditorTest'
import MinimalEditor from './components/PostcardEditor/MinimalEditor'
import BasicEditor from './components/PostcardEditor/BasicEditor'
import HeadlessTest from './components/PostcardEditor/HeadlessTest'
import PostcardEngineEditor from './components/PostcardEditor/PostcardEngineEditor'
import PostcardEngineEditorPro from './components/PostcardEditor/PostcardEngineEditorPro'
import PostcardEditorElegant from './components/PostcardEditor/PostcardEditorElegant'
import PostcardEditorNew from './components/PostcardEditor/PostcardEditorNew'
import './App.css'

function App() {
  const testMode = 'professional'; // 'editor', 'test', 'minimal', 'basic', 'headless', 'engine', 'professional', or false
  
  // Sample business data
  const businessData = {
    businessName: 'ABC LAUNDRY',
    headline: 'DROP OFF YOUR',
    subheadline: 'DRY CLEANING!',
    services: [
      'Free Single Item Cleaning',
      'Free Soap for One Wash',
      'Free Drying on Monday',
      'Free Folding for 10 Items'
    ],
    phone: '1-800-628-1804',
    website: 'www.abclaundry.com',
    callToAction: 'CALL OR VISIT US TODAY!',
    offerAmount: '$25 OFF',
    offerDescription: 'Your First Service'
  }

  if (testMode === 'test') {
    return <TestEditor />;
  } else if (testMode === 'editor') {
    return <SimplifiedEditorTest />;
  } else if (testMode === 'minimal') {
    return <MinimalEditor />;
  } else if (testMode === 'basic') {
    return <BasicEditor />;
  } else if (testMode === 'headless') {
    return <HeadlessTest />;
  } else if (testMode === 'engine') {
    return <PostcardEditorElegant />;
  } else if (testMode === 'professional') {
    return <PostcardEditorNew />;
  }

  return (
    <SimplifiedPostcardEditor businessData={businessData} />
  )
}

export default App
