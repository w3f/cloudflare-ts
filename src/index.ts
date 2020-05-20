import process from 'process';
import program from 'commander';

import { deleteDNSAction } from './actions/delete-dns';

program
    .command('delete-dns')
    .description('Deletes dns entries matching a pattern.')
    .option('-z, --zone [zone]', 'Name of the Zone owning the record.')
    .option('-r, --record [record]', 'Name of the DNS entry to delete.')
    .action(deleteDNSAction);

program.allowUnknownOption(false)

program.parse(process.argv)
