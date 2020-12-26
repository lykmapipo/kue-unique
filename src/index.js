import kue from 'kue';

// import static and instance methods
import './job.statics';
import './job.instances';

// export a patched kue with unique job capabilities
export default kue;
