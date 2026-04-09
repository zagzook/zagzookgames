<?php

class Dashboard extends Trongate
{

    public function index()
    {
        //make sure user is logged in as a member before allowing access to this page
        $this->trongate_security->make_sure_allowed('members area');
        echo 'Welcome to the members\' area!';
    }
}
